/* COMSATS Sports Society: admin panel.
   Edits a draft copy of content.json, previews it live in the iframe, and publishes it via /api/content. */

(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  const TOKEN_KEY = "css-admin-token";
  const DRAFT_KEY = "css-admin-draft";
  const SITE_ROOT = new URL("../", location.href);
  const siteUrl = (p) => new URL(p, SITE_ROOT).href;

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    published: null,
    draft: null,
    defaults: null,
    section: null,
    openItems: new Set(),
    previewPage: null,
    device: "desktop",
    pickerCallback: null,
  };

  /* ---------- paths ---------- */
  const split = (path) => path.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k));
  const getPath = (obj, path) => split(path).reduce((o, k) => (o == null ? undefined : o[k]), obj);
  function setPath(obj, path, value) {
    const keys = split(path);
    let o = obj;
    keys.slice(0, -1).forEach((k, i) => {
      if (o[k] == null || typeof o[k] !== "object") o[k] = typeof keys[i + 1] === "number" ? [] : {};
      o = o[k];
    });
    o[keys[keys.length - 1]] = value;
  }
  // fill keys missing from `target` with values from `defaults` (for content saved before a field existed)
  function fillDefaults(target, defaults) {
    if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) return target;
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in target)) target[k] = clone(v);
      else if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object") fillDefaults(target[k], v);
    }
    return target;
  }

  /* ---------- API ---------- */
  async function api(path, { method = "GET", body } = {}) {
    const res = await fetch(siteUrl(path.replace(/^\//, "")), {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== "/api/login") {
      logout("Your session expired. Log in again.");
      throw new Error("unauthorized");
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  /* ---------- toasts ---------- */
  function toast(msg, kind = "") {
    const el = h(`<div class="toast ${kind ? `is-${kind}` : ""}">${esc(msg)}</div>`);
    $("#toasts").append(el);
    setTimeout(() => el.remove(), kind === "error" ? 7000 : 3800);
  }

  /* ---------- auth ---------- */
  function showLogin(message = "") {
    $("#app").hidden = true;
    $("#login").hidden = false;
    $("#loginError").textContent = message;
    $("#password").focus();
  }

  function logout(message = "") {
    state.token = "";
    localStorage.removeItem(TOKEN_KEY);
    showLogin(message);
  }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#loginBtn");
    btn.disabled = true;
    btn.textContent = "Checking…";
    $("#loginError").textContent = "";
    try {
      const data = await api("/api/login", { method: "POST", body: { password: $("#password").value } });
      state.token = data.token;
      localStorage.setItem(TOKEN_KEY, data.token);
      $("#password").value = "";
      await boot();
    } catch (err) {
      $("#loginError").textContent = err.message === "Failed to fetch" ? "Can't reach the server." : err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });

  $("#logoutBtn").addEventListener("click", () => logout());

  /* ---------- boot ---------- */
  async function loadPublished() {
    const defaults = await fetch(siteUrl("content.json"), { cache: "no-store" }).then((r) => r.json());
    let published = null;
    try {
      const res = await fetch(siteUrl("api/content"), { cache: "no-store" });
      if (res.ok) published = await res.json();
    } catch (e) {}
    state.defaults = defaults;
    state.published = fillDefaults(published || clone(defaults), defaults);
  }

  async function boot() {
    $("#login").hidden = true;
    $("#app").hidden = false;
    await loadPublished();

    let restored = false;
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved && JSON.stringify(saved) !== JSON.stringify(state.published)) {
        state.draft = fillDefaults(saved, state.defaults);
        restored = true;
      }
    } catch (e) {}
    state.draft ??= clone(state.published);
    if (!restored) localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));

    renderSidebar();
    const fromHash = location.hash.slice(1);
    openSection(SCHEMA.find((s) => s.id === fromHash) ? fromHash : SCHEMA[0].id);
    updateStatus();
    if (restored) showBanner("You have unpublished changes from your last session. They're restored below.", [
      { label: "Discard them", cls: "btn-line", run: discardChanges },
    ]);
    checkStorage();
  }

  // warn straight away if publishing can't work (storage not connected, bad token…)
  async function checkStorage() {
    try {
      const st = await api("/api/status");
      if (!st.ok) showBanner(`Publishing and uploads won't work yet. ${st.error}`, [
        { label: "Check again", cls: "btn-line", run: () => { hideBanner(); checkStorage(); } },
      ]);
    } catch (e) {}
  }

  (async function init() {
    if (!state.token) return showLogin();
    try {
      const res = await api("/api/login");
      if (res.ok) return boot();
    } catch (e) {}
    logout();
  })();

  /* ---------- status / publish ---------- */
  const isDirty = () => JSON.stringify(state.draft) !== JSON.stringify(state.published);

  function updateStatus() {
    const dirty = isDirty();
    $("#status").classList.toggle("is-dirty", dirty);
    $("#statusText").textContent = dirty ? "Unpublished changes" : "All changes published";
    $("#publishBtn").disabled = !dirty;
    $("#discardBtn").hidden = !dirty;
    $$(".side-link").forEach((a) => {
      const sec = SCHEMA.find((s) => s.id === a.dataset.id);
      const changed = sec && sectionKeys(sec).some((k) => JSON.stringify(getPath(state.draft, k)) !== JSON.stringify(getPath(state.published, k)));
      a.querySelector(".dirty-dot")?.remove();
      if (changed) a.append(h('<span class="dirty-dot" title="Unpublished changes"></span>'));
    });
    const logo = getPath(state.draft, "site.logo");
    if (logo) $("#brandLogo").src = siteUrl(logo);
  }

  const sectionKeys = (sec) => [...(sec.fields || []), ...(sec.subsections || []).flatMap((s) => s.fields)].map((f) => f.key);

  let saveTimer = null, previewTimer = null;
  function changed() {
    updateStatus();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft)), 250);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(pushPreview, 180);
  }

  async function publish() {
    const btn = $("#publishBtn");
    btn.disabled = true;
    btn.textContent = "Publishing…";
    try {
      await api("/api/content", { method: "PUT", body: { content: state.draft } });
      state.published = clone(state.draft);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));
      hideBanner();
      toast("Published. The live site updates within a few seconds.", "ok");
    } catch (err) {
      if (err.message !== "unauthorized") toast(`Couldn't publish: ${err.message}`, "error");
    } finally {
      btn.textContent = "Publish";
      updateStatus();
    }
  }

  function discardChanges() {
    if (!confirm("Discard all unpublished changes? The editor goes back to what's live on the site.")) return;
    state.draft = clone(state.published);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));
    hideBanner();
    openSection(state.section.id);
    changed();
    toast("Changes discarded.");
  }

  $("#publishBtn").addEventListener("click", publish);
  $("#discardBtn").addEventListener("click", discardChanges);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (isDirty()) publish();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (state.draft && isDirty()) { e.preventDefault(); e.returnValue = ""; }
  });

  function showBanner(text, actions = []) {
    const b = $("#banner");
    b.innerHTML = `<span>${esc(text)}</span>`;
    actions.forEach((a) => {
      const btn = h(`<button class="btn ${a.cls || "btn-line"}">${esc(a.label)}</button>`);
      btn.addEventListener("click", a.run);
      b.append(btn);
    });
    b.hidden = false;
  }
  function hideBanner() { $("#banner").hidden = true; }

  /* ---------- sidebar ---------- */
  function renderSidebar() {
    const groups = [...new Set(SCHEMA.map((s) => s.group))];
    $("#sidebar").innerHTML = groups.map((g) => `
      <div class="side-group">
        <h3>${esc(g)}</h3>
        ${SCHEMA.filter((s) => s.group === g).map((s) => `<button class="side-link" data-id="${s.id}">${esc(s.title)}</button>`).join("")}
      </div>`).join("");
  }
  $("#sidebar").addEventListener("click", (e) => {
    const link = e.target.closest(".side-link");
    if (!link) return;
    openSection(link.dataset.id);
    $("#sidebar").classList.remove("open");
    $("#menuBtn").setAttribute("aria-expanded", "false");
  });
  $("#menuBtn").addEventListener("click", () => {
    const open = $("#sidebar").classList.toggle("open");
    $("#menuBtn").setAttribute("aria-expanded", open);
  });

  /* ---------- editor ---------- */
  // re-render the current section without closing the list items that are open
  function redrawSection() {
    const scroll = $("#editor").scrollTop;
    openSection(state.section.id, { keepOpen: true });
    $("#editor").scrollTop = scroll;
  }

  function openSection(id, { keepOpen = false } = {}) {
    const sec = SCHEMA.find((s) => s.id === id);
    state.section = sec;
    if (!keepOpen) state.openItems.clear();
    history.replaceState(null, "", `#${id}`);
    $$(".side-link").forEach((a) => a.classList.toggle("is-active", a.dataset.id === id));

    const ed = $("#editor");
    ed.innerHTML = "";
    const head = h(`<header class="ed-head">
        <p class="eyebrow">${esc(sec.group)}</p>
        <h1>${esc(sec.title)}</h1>
        ${sec.intro ? `<p>${esc(sec.intro)}</p>` : ""}
      </header>`);
    if (sec.actions) {
      const row = h('<div class="ed-actions"></div>');
      sec.actions.forEach((a) => {
        const btn = h(`<button class="btn btn-line btn-sm">${esc(a.label)}</button>`);
        btn.addEventListener("click", () => ACTIONS[a.run]());
        row.append(btn);
      });
      head.append(row);
    }
    ed.append(head);

    if (sec.tool) TOOLS[sec.tool](ed);
    else {
      const box = h('<div class="fields"></div>');
      sec.fields.forEach((f) => box.append(fieldEl(f, f.key)));
      (sec.subsections || []).forEach((sub) => {
        const det = h(`<details class="sub"><summary>${esc(sub.title)}</summary>${sub.help ? `<p class="help" style="margin-top:8px">${esc(sub.help)}</p>` : ""}<div class="fields"></div></details>`);
        sub.fields.forEach((f) => $(".fields", det).append(fieldEl(f, f.key)));
        box.append(det);
      });
      ed.append(box);
    }
    ed.scrollTop = 0;
    if (sec.page) showPreviewPage(sec.page, sec.anchor, sec.previewExtra || "");
    updateStatus();
  }

  let uid = 0;
  function fieldEl(f, path, onChange) {
    const id = `f${++uid}`;
    const value = getPath(state.draft, path);
    const wrap = h(`<div class="f ${f.half ? "f-half" : ""}"></div>`);
    const set = (v) => { setPath(state.draft, path, v); onChange?.(v); changed(); };
    const label = `<label for="${id}">${esc(f.label)}</label>`;
    const help = f.help ? `<p class="help">${esc(f.help)}</p>` : "";

    switch (f.type) {
      case "textarea": {
        wrap.innerHTML = `${label}<textarea id="${id}" rows="${f.rows || 3}">${esc(value ?? "")}</textarea>${help}`;
        $("textarea", wrap).addEventListener("input", (e) => set(e.target.value));
        break;
      }
      case "toggle": {
        wrap.innerHTML = `<label class="toggle"><input type="checkbox" id="${id}" ${value ? "checked" : ""} /><span class="track"></span>${esc(f.label)}</label>${help}`;
        $("input", wrap).addEventListener("change", (e) => {
          // "exclusive": switching this on switches it off on every other item in the same list
          if (f.exclusive && e.target.checked) {
            const parts = path.split(".");
            const siblings = getPath(state.draft, parts.slice(0, -2).join("."));
            if (Array.isArray(siblings)) siblings.forEach((it) => { if (it && typeof it === "object") it[f.key] = false; });
          }
          set(e.target.checked);
          if (f.exclusive) redrawSection();
        });
        break;
      }
      case "color": {
        const v = value || "#000000";
        wrap.innerHTML = `${label}<div class="color-row"><input type="color" id="${id}" value="${esc(v)}" /><input type="text" value="${esc(v)}" maxlength="7" aria-label="${esc(f.label)} hex code" /></div>${help}`;
        const [pick, text] = $$("input", wrap);
        pick.addEventListener("input", () => { text.value = pick.value; set(pick.value); });
        text.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) { pick.value = text.value; set(text.value); } });
        break;
      }
      case "select": {
        wrap.innerHTML = `${label}<select id="${id}">${f.options.map(([v, l]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>${help}`;
        $("select", wrap).addEventListener("change", (e) => set(e.target.value));
        break;
      }
      case "number": {
        wrap.innerHTML = `${label}<input type="number" id="${id}" value="${esc(value ?? "")}" ${f.min != null ? `min="${f.min}"` : ""} ${f.max != null ? `max="${f.max}"` : ""} />${help}`;
        $("input", wrap).addEventListener("input", (e) => set(e.target.value === "" ? "" : Number(e.target.value)));
        break;
      }
      case "image": return imageField(f, path, wrap, set, value, help);
      case "list": return listField(f, path);
      case "strings": return stringsField(f, path, wrap, help);
      default: {
        const type = { url: "url", date: "date", time: "time" }[f.type] || "text";
        const list = f.suggestions ? `<datalist id="${id}-dl">${f.suggestions.map((s) => `<option value="${esc(s)}">`).join("")}</datalist>` : "";
        wrap.innerHTML = `${label}<input type="${type === "url" ? "text" : type}" ${type === "url" ? 'inputmode="url" spellcheck="false"' : ""} id="${id}" value="${esc(value ?? "")}" ${f.suggestions ? `list="${id}-dl"` : ""} />${list}${help}`;
        $("input", wrap).addEventListener("input", (e) => set(e.target.value));
      }
    }
    return wrap;
  }

  /* image field: preview + upload + library + link */
  function imageField(f, path, wrap, set, value, help) {
    const draw = () => {
      const v = getPath(state.draft, path) || "";
      wrap.innerHTML = `
        <span class="f-label">${esc(f.label)}</span>
        <div class="img-field">
          <div class="img-box">${v ? `<img src="${esc(siteUrl(v))}" alt="" />` : "No image"}</div>
          <div>
            <div class="img-actions">
              <label class="btn btn-line">Upload<input type="file" accept="image/*" hidden /></label>
              <button type="button" class="btn btn-line lib">Library</button>
              ${v ? '<button type="button" class="btn btn-danger rm">Remove</button>' : ""}
            </div>
            <details class="img-url"><summary>Use an image link instead</summary><input type="text" spellcheck="false" value="${esc(v)}" placeholder="https://…" style="width:100%;height:38px;padding:0 10px;border:0;border-bottom:2px solid var(--rule);background:var(--chalk)" /></details>
            ${help}
          </div>
        </div>`;
      $('input[type="file"]', wrap).addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        $(".img-actions", wrap).insertAdjacentHTML("beforeend", '<span class="img-busy">Uploading…</span>');
        try { set(await uploadImage(file)); draw(); toast("Image uploaded.", "ok"); }
        catch (err) { toast(err.message, "error"); draw(); }
      });
      $(".lib", wrap).addEventListener("click", () => openPicker((url) => { set(url); draw(); }));
      $(".rm", wrap)?.addEventListener("click", () => { set(""); draw(); });
      $(".img-url input", wrap).addEventListener("change", (e) => { set(e.target.value.trim()); draw(); });
    };
    draw();
    return wrap;
  }

  /* list of strings */
  function stringsField(f, path, wrap, help) {
    const draw = () => {
      const arr = getPath(state.draft, path) || [];
      wrap.innerHTML = `<span class="f-label">${esc(f.label)}</span>${help}<div class="strings"></div>`;
      const box = $(".strings", wrap);
      arr.forEach((val, i) => {
        const row = h(`<div class="string-row"><input type="text" value="${esc(val)}" aria-label="${esc(f.itemLabel || "item")} ${i + 1}" style="height:40px;padding:0 12px;border:0;border-bottom:2px solid var(--rule);background:var(--chalk)" /><button type="button" title="Remove" aria-label="Remove">✕</button></div>`);
        $("input", row).addEventListener("input", (e) => { arr[i] = e.target.value; setPath(state.draft, path, arr); changed(); });
        $("button", row).addEventListener("click", () => { arr.splice(i, 1); setPath(state.draft, path, arr); changed(); draw(); });
        box.append(row);
      });
      const add = h(`<button type="button" class="add-btn">+ Add ${esc(f.itemLabel || "item")}</button>`);
      add.addEventListener("click", () => {
        arr.push("");
        setPath(state.draft, path, arr);
        changed();
        draw();
        $$(".string-row input", wrap).pop()?.focus();
      });
      box.append(add);
    };
    draw();
    return wrap;
  }

  /* list of objects (sports, fixtures, members, clubs…) */
  function listField(f, path) {
    const wrap = h('<div class="list"></div>');
    const draw = () => {
      const arr = getPath(state.draft, path) || [];
      wrap.innerHTML = `
        <div class="list-head"><span class="f-label">${esc(f.label)}</span><span class="count">${arr.length} ${esc(f.itemLabel || "item")}${arr.length === 1 ? "" : "s"}</span></div>
        ${f.help ? `<p class="help">${esc(f.help)}</p>` : ""}`;

      arr.forEach((item, i) => {
        const key = `${path}.${i}`;
        const open = state.openItems.has(key);
        const title = () => `${f.starKey && item[f.starKey] ? "⭐ " : ""}${(f.titleKey && item[f.titleKey]) || `${f.itemLabel || "Item"} ${i + 1}`}`;
        const thumbKey = f.fields.find((x) => x.type === "image")?.key;
        const el = h(`
          <div class="item ${open ? "is-open" : ""}">
            <div class="item-head">
              <button type="button" class="item-toggle" aria-expanded="${open}">
                ${thumbKey && item[thumbKey] ? `<img class="item-thumb" src="${esc(siteUrl(item[thumbKey]))}" alt="" />` : ""}
                <span class="item-title"></span>
                ${f.subtitleKey ? '<span class="item-sub"></span>' : ""}
              </button>
              <div class="item-tools">
                <button type="button" class="up" title="Move up" aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button>
                <button type="button" class="down" title="Move down" aria-label="Move down" ${i === arr.length - 1 ? "disabled" : ""}>↓</button>
                <button type="button" class="dup" title="Duplicate" aria-label="Duplicate">⧉</button>
                <button type="button" class="del" title="Delete" aria-label="Delete">✕</button>
              </div>
            </div>
          </div>`);
        const setTitle = () => {
          $(".item-title", el).textContent = title();
          if (f.subtitleKey) $(".item-sub", el).textContent = item[f.subtitleKey] || "";
        };
        setTitle();

        if (open) {
          const body = h('<div class="item-body"><div class="fields"></div></div>');
          f.fields.forEach((sub) => $(".fields", body).append(fieldEl(sub, `${key}.${sub.key}`, setTitle)));
          el.append(body);
        }

        $(".item-toggle", el).addEventListener("click", () => {
          state.openItems.has(key) ? state.openItems.delete(key) : state.openItems.add(key);
          draw();
        });
        const move = (to) => {
          arr.splice(to, 0, arr.splice(i, 1)[0]);
          state.openItems.clear();
          changed();
          draw();
        };
        $(".up", el).addEventListener("click", () => move(i - 1));
        $(".down", el).addEventListener("click", () => move(i + 1));
        $(".dup", el).addEventListener("click", () => {
          arr.splice(i + 1, 0, clone(item));
          state.openItems.clear();
          state.openItems.add(`${path}.${i + 1}`);
          changed();
          draw();
        });
        $(".del", el).addEventListener("click", () => {
          if (!confirm(`Delete “${title()}”?`)) return;
          arr.splice(i, 1);
          state.openItems.clear();
          changed();
          draw();
        });
        wrap.append(el);
      });

      const add = h(`<button type="button" class="add-btn">+ Add ${esc(f.itemLabel || "item")}</button>`);
      add.addEventListener("click", () => {
        arr.push(clone(f.item || {}));
        setPath(state.draft, path, arr);
        state.openItems.add(`${path}.${arr.length - 1}`);
        changed();
        draw();
        $$(".item", wrap).pop()?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      wrap.append(add);
    };
    draw();
    return wrap;
  }

  /* ---------- images: resize in the browser, then upload ---------- */
  async function uploadImage(file) {
    if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");
    let blob = file;
    if (!/gif|svg/.test(file.type)) blob = await shrink(file, 2000);
    if (blob.size > 3_000_000) throw new Error("Image is too large even after resizing. Try a smaller photo.");
    const data = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1]);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const res = await api("/api/upload", { method: "POST", body: { name: file.name, type: blob.type, data } });
    return res.url;
  }

  function shrink(file, max) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((webp) => {
          if (webp && webp.type === "image/webp" && webp.size < file.size * 1.1) return resolve(webp);
          if (scale === 1) return resolve(file);
          canvas.toBlob((b) => resolve(b || file), file.type === "image/png" ? "image/png" : "image/jpeg", 0.86);
        }, "image/webp", 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  /* ---------- media library ---------- */
  async function mediaGrid(grid, { pick } = {}) {
    grid.innerHTML = '<p class="empty-note">Loading images…</p>';
    let items = [];
    try { items = (await api("/api/media")).items; }
    catch (err) { grid.innerHTML = `<p class="empty-note">${esc(err.message)}</p>`; return; }
    if (!items.length) { grid.innerHTML = '<p class="empty-note">No uploaded images yet.</p>'; return; }
    grid.innerHTML = "";
    items.forEach((m) => {
      const tile = h(`<div class="media-tile">
          <img src="${esc(siteUrl(m.url))}" alt="" loading="lazy" />
          <div class="mt-actions">
            ${pick ? '<button type="button" class="pick">Use</button>' : '<button type="button" class="copy">Copy link</button>'}
            <button type="button" class="rm">Delete</button>
          </div>
        </div>`);
      $(".pick", tile)?.addEventListener("click", () => pick(m.url));
      $(".copy", tile)?.addEventListener("click", async () => { await navigator.clipboard.writeText(m.url); toast("Link copied."); });
      $(".rm", tile).addEventListener("click", async () => {
        const used = JSON.stringify(state.draft).includes(m.url);
        if (!confirm(used ? "This image is used on the site. Delete it anyway? It will disappear from those places." : "Delete this image permanently?")) return;
        try { await api(`/api/media?url=${encodeURIComponent(m.url)}`, { method: "DELETE" }); tile.remove(); toast("Image deleted."); }
        catch (err) { toast(err.message, "error"); }
      });
      grid.append(tile);
    });
  }

  function openPicker(cb) {
    state.pickerCallback = cb;
    $("#mediaModal").hidden = false;
    mediaGrid($("#modalGrid"), { pick: (url) => { closePicker(); cb(url); } });
  }
  function closePicker() { $("#mediaModal").hidden = true; state.pickerCallback = null; }
  $("#mediaClose").addEventListener("click", closePicker);
  $("#mediaModal").addEventListener("click", (e) => e.target.id === "mediaModal" && closePicker());
  document.addEventListener("keydown", (e) => e.key === "Escape" && !$("#mediaModal").hidden && closePicker());
  $("#modalUpload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const url = await uploadImage(file);
      toast("Image uploaded.", "ok");
      const cb = state.pickerCallback;
      closePicker();
      cb?.(url);
    } catch (err) { toast(err.message, "error"); }
    e.target.value = "";
  });

  /* ---------- tools ---------- */
  /* find & replace across all text (never links, images, ids, dates) */
  const SKIP_KEY = /(link|url|href|image|src|photo|logo|endpoint|^id$|icon|status|date|time|frequency)/i;
  const LOOKS_URL = /^(https?:|\/|#|mailto:|tel:)|\.html\b/i;
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function findMatches(find, replace, { keepCase, wholeWord }) {
    const re = new RegExp(wholeWord ? `\\b${escRe(find)}\\b` : escRe(find), keepCase ? "gi" : "g");
    const swap = (m) => {
      if (!keepCase) return replace;
      if (m === m.toUpperCase() && m !== m.toLowerCase()) return replace.toUpperCase();
      if (m[0] === m[0].toUpperCase()) return replace.charAt(0).toUpperCase() + replace.slice(1);
      return replace.toLowerCase();
    };
    const hits = [];
    const walk = (obj, path) => {
      Object.entries(obj).forEach(([k, v]) => {
        const p = path ? `${path}.${k}` : k;
        if (typeof v === "string") {
          if ((!Array.isArray(obj) && SKIP_KEY.test(k)) || LOOKS_URL.test(v)) return;
          re.lastIndex = 0;
          if (re.test(v)) { re.lastIndex = 0; hits.push({ obj, k, path: p, before: v, after: v.replace(re, swap) }); }
        } else if (v && typeof v === "object") walk(v, p);
      });
    };
    walk(state.draft, "");
    return hits;
  }

  const TOOLS = {
    replace(ed) {
      const card = h(`<div class="tool-card">
          <div class="fields" style="border:0;padding:0">
            <div class="f f-half"><label for="frFind">Find</label><input type="text" id="frFind" placeholder="club" /></div>
            <div class="f f-half"><label for="frRep">Replace with</label><input type="text" id="frRep" placeholder="team" /></div>
            <div class="f"><label class="toggle"><input type="checkbox" id="frCase" checked /><span class="track"></span>Keep capitals (club → team, Club → Team, CLUB → TEAM)</label></div>
            <div class="f"><label class="toggle"><input type="checkbox" id="frWord" /><span class="track"></span>Whole words only</label></div>
          </div>
          <div class="tool-row" style="margin:18px 0 8px">
            <button type="button" class="btn btn-line" id="frPreview">Preview changes</button>
            <button type="button" class="btn btn-sky" id="frApply" disabled>Replace all</button>
          </div>
          <p class="help" id="frCount"></p>
          <ul class="history" id="frList"></ul>
        </div>`);
      ed.append(card);
      let hits = [];
      const opts = () => ({ keepCase: $("#frCase").checked, wholeWord: $("#frWord").checked });
      const preview = () => {
        const find = $("#frFind").value;
        if (!find.trim()) { $("#frCount").textContent = "Type a word to find."; return; }
        hits = findMatches(find, $("#frRep").value, opts());
        $("#frCount").textContent = hits.length ? `${hits.length} place${hits.length === 1 ? "" : "s"} will change:` : "No matches.";
        $("#frApply").disabled = !hits.length;
        $("#frList").innerHTML = hits.slice(0, 200).map((x) => `<li><div><div class="meta">${esc(x.path)}</div><div>${esc(x.before)}</div><div class="when" style="color:var(--sky-deep)">→ ${esc(x.after)}</div></div></li>`).join("");
      };
      $("#frPreview").addEventListener("click", preview);
      [$("#frFind"), $("#frRep")].forEach((i) => i.addEventListener("keydown", (e) => e.key === "Enter" && preview()));
      $("#frApply").addEventListener("click", () => {
        hits = findMatches($("#frFind").value, $("#frRep").value, opts());
        hits.forEach((x) => { x.obj[x.k] = x.after; });
        changed();
        toast(`Replaced in ${hits.length} place${hits.length === 1 ? "" : "s"}. Check the preview, then Publish.`, "ok");
        $("#frApply").disabled = true;
        $("#frCount").textContent = "Done. Nothing is live until you click Publish.";
        $("#frList").innerHTML = "";
      });
    },

    media(ed) {
      const card = h(`<div class="tool-card">
          <div class="tool-row" style="margin-bottom:18px"><label class="btn btn-sky">Upload image<input type="file" accept="image/*" hidden /></label></div>
          <div class="media-grid"></div>
        </div>`);
      const grid = $(".media-grid", card);
      $("input", card).addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try { await uploadImage(file); toast("Image uploaded.", "ok"); mediaGrid(grid); }
        catch (err) { toast(err.message, "error"); }
      });
      ed.append(card);
      mediaGrid(grid);
    },

    async history(ed) {
      const card = h('<div class="tool-card"><ul class="history"><li class="empty-note">Loading…</li></ul></div>');
      ed.append(card);
      const list = $(".history", card);
      try {
        const { items } = await api("/api/history");
        if (!items.length) { list.innerHTML = '<li class="empty-note">Nothing published yet. Your first publish will appear here.</li>'; return; }
        list.innerHTML = "";
        items.forEach((v) => {
          const d = new Date(v.savedAt);
          const row = h(`<li>
              <div><div class="when">${esc(d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }))}</div><div class="meta">${Math.round((v.size || 0) / 1024)} KB</div></div>
              <button type="button" class="btn btn-line btn-sm">Load into editor</button>
            </li>`);
          $("button", row).addEventListener("click", async () => {
            if (isDirty() && !confirm("Loading this version replaces your unpublished changes. Continue?")) return;
            try {
              const content = await api(`/api/history?id=${v.id}`);
              state.draft = fillDefaults(content, state.defaults);
              changed();
              toast("Version loaded. Check the preview, then Publish to restore it.", "ok");
            } catch (err) { toast(err.message, "error"); }
          });
          list.append(row);
        });
      } catch (err) { list.innerHTML = `<li class="empty-note">${esc(err.message)}</li>`; }
    },

    backup(ed) {
      const card = h(`<div>
          <div class="tool-card">
            <h2>Download a backup</h2>
            <p>Saves everything in the editor (including unpublished changes) as a .json file.</p>
            <button type="button" class="btn btn-sky dl">Download backup</button>
          </div>
          <div class="tool-card">
            <h2>Restore from a backup</h2>
            <p>Loads a backup file into the editor. Nothing goes live until you publish.</p>
            <label class="btn btn-line">Choose backup file<input type="file" accept="application/json,.json" hidden /></label>
          </div>
          <div class="tool-card">
            <h2>Start over</h2>
            <p>Loads the website's original built-in content into the editor. Nothing goes live until you publish.</p>
            <button type="button" class="btn btn-danger reset">Load original content</button>
          </div>
        </div>`);
      $(".dl", card).addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(state.draft, null, 2)], { type: "application/json" });
        const a = h(`<a download="css-site-backup-${new Date().toISOString().slice(0, 10)}.json"></a>`);
        a.href = URL.createObjectURL(blob);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
      $('input[type="file"]', card).addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (!data.site || !data.home) throw new Error("This file isn't a site backup.");
          state.draft = fillDefaults(data, state.defaults);
          changed();
          toast("Backup loaded. Publish to make it live.", "ok");
        } catch (err) { toast(err.message.startsWith("Unexpected") ? "That file isn't valid JSON." : err.message, "error"); }
        e.target.value = "";
      });
      $(".reset", card).addEventListener("click", () => {
        if (!confirm("Replace the editor contents with the original built-in content?")) return;
        state.draft = clone(state.defaults);
        changed();
        toast("Original content loaded. Publish to make it live.");
      });
      ed.append(card);
    },
  };

  const ACTIONS = {
    resetTheme() {
      state.draft.theme = { ...DEFAULT_THEME };
      changed();
      openSection("theme");
    },
    replayIntro() {
      if ($("#layout").classList.contains("no-preview")) togglePreview(true);
      state.previewPage = null;
      showPreviewPage("index.html", "", "&intro=1");
    },
    openSheet() {
      const url = getPath(state.draft, "recruitment.sheetUrl");
      if (url) window.open(url, "_blank", "noopener");
      else toast("Paste your Google Sheet link in “Applications sheet” first.");
    },
  };

  /* ---------- live preview ---------- */
  const frame = $("#previewFrame");
  const PAGE_NAMES = { "index.html": "Home", "clubs.html": "Clubs page", "recruitment.html": "Recruitment page" };

  function showPreviewPage(page, anchor = "", extra = "") {
    $("#previewPage").textContent = `Preview · ${PAGE_NAMES[page] || page}`;
    $("#previewOpen").href = siteUrl(page);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draft));
    const key = page + extra;
    if (state.previewPage === key) {
      scrollPreview(anchor);
      return;
    }
    state.previewPage = key;
    state.pendingAnchor = anchor;
    frame.src = siteUrl(`${page}?preview=1${extra}`);
  }

  function scrollPreview(anchor) {
    try {
      const doc = frame.contentDocument;
      const el = anchor && anchor !== "#top" ? doc.querySelector(anchor) : null;
      frame.contentWindow.scrollTo({ top: el ? el.getBoundingClientRect().top + frame.contentWindow.scrollY - 70 : 0, behavior: "smooth" });
    } catch (e) {}
  }

  function pushPreview() {
    try { frame.contentWindow.postMessage({ type: "css-preview", content: state.draft }, location.origin); } catch (e) {}
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.data?.type !== "css-preview-ready") return;
    pushPreview();
  });
  frame.addEventListener("load", () => setTimeout(() => scrollPreview(state.pendingAnchor), 350));

  function togglePreview(force) {
    const layout = $("#layout");
    const show = force ?? layout.classList.contains("no-preview");
    layout.classList.toggle("no-preview", !show);
    $("#previewToggle").setAttribute("aria-pressed", show);
  }
  $("#previewToggle").addEventListener("click", () => togglePreview());
  if (matchMedia("(max-width: 1180px)").matches) togglePreview(false);

  $(".seg").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-device]");
    if (!btn) return;
    state.device = btn.dataset.device;
    $$(".seg button").forEach((b) => b.classList.toggle("is-active", b === btn));
    $("#previewStage").classList.toggle("is-mobile", state.device === "mobile");
  });
})();
