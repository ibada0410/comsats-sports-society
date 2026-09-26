/* Loads the site content (edited in /admin) and fills it into the page.
   Order: admin preview draft → cached copy (instant) → /api/content → content.json fallback. */

(function () {
  const CACHE_KEY = "css-content-cache";
  const renderers = [];
  const isPreview = new URLSearchParams(location.search).has("preview");
  let current = null;

  const get = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const escHtml = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // text with line breaks ("\n" in the admin becomes a <br>)
  const rich = (s) => escHtml(s).replace(/\n/g, "<br />");
  // only allow web, mail, phone, in-page and relative links/images
  const safeUrl = (u) => {
    const s = String(u || "").trim();
    if (!s) return "";
    if (/^(https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(s)) return s;
    if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return "#"; // javascript:, data:, etc.
    return s;
  };

  /* fonts the admin can pick (Google Fonts) */
  const FONTS = {
    "Big Shoulders Display": "Big+Shoulders+Display:wght@700;800;900",
    "Anton": "Anton",
    "Bebas Neue": "Bebas+Neue",
    "Oswald": "Oswald:wght@500;600;700",
    "Barlow Condensed": "Barlow+Condensed:wght@600;700;800;900",
    "Teko": "Teko:wght@500;600;700",
    "Saira Extra Condensed": "Saira+Extra+Condensed:wght@700;800;900",
    "Archivo": "Archivo:wdth,wght@62..125,400..800",
    "Barlow": "Barlow:wght@400;500;600;700",
    "Manrope": "Manrope:wght@400;500;600;700;800",
    "DM Sans": "DM+Sans:wght@400;500;600;700",
    "Work Sans": "Work+Sans:wght@400;500;600;700",
    "Poppins": "Poppins:wght@400;500;600;700",
    "Inter": "Inter:wght@400;500;600;700",
  };
  const BUILT_IN = ["Big Shoulders Display", "Archivo"];

  function applyFonts(t = {}) {
    const r = document.documentElement.style;
    const extra = [t.displayFont, t.bodyFont].filter((f) => f && FONTS[f] && !BUILT_IN.includes(f));
    let link = document.getElementById("cms-fonts");
    if (extra.length) {
      const href = `https://fonts.googleapis.com/css2?${extra.map((f) => `family=${FONTS[f]}`).join("&")}&display=swap`;
      if (!link) { link = document.createElement("link"); link.id = "cms-fonts"; link.rel = "stylesheet"; document.head.append(link); }
      if (link.href !== href) link.href = href;
    }
    if (t.displayFont && FONTS[t.displayFont]) r.setProperty("--display", `"${t.displayFont}", "Arial Narrow", sans-serif`);
    if (t.bodyFont && FONTS[t.bodyFont]) r.setProperty("--body", `"${t.bodyFont}", "Helvetica Neue", sans-serif`);
  }

  function applyTheme(t = {}) {
    const r = document.documentElement.style;
    applyFonts(t);
    if (t.sky) { r.setProperty("--sky", t.sky); r.setProperty("--sky-deep", `color-mix(in srgb, ${t.sky} 78%, #000)`); }
    if (t.ink) { r.setProperty("--ink", t.ink); r.setProperty("--ink-2", `color-mix(in srgb, ${t.ink} 86%, #fff)`); }
    if (t.chalk) r.setProperty("--chalk", t.chalk);
    if (t.signal) r.setProperty("--signal", t.signal);
  }

  function applyLogo(logo) {
    if (logo) document.documentElement.style.setProperty("--logo", `url("${safeUrl(logo).replace(/"/g, "%22")}")`);
  }

  function applyMeta(C) {
    const page = document.documentElement.dataset.page || "home";
    const title = get(C, `seo.${page}Title`);
    const desc = get(C, `seo.${page}Description`);
    if (title) document.title = title;
    const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
    set('meta[name="description"]', "content", desc);
    set('meta[property="og:title"]', "content", title);
    set('meta[property="og:description"]', "content", desc);
    set('meta[property="og:image"]', "content", safeUrl(get(C, "seo.shareImage")));
    set('link[rel="icon"]', "href", safeUrl(get(C, "site.logo")));
  }

  function bind(C, root = document) {
    root.querySelectorAll("[data-c]").forEach((el) => {
      const v = get(C, el.dataset.c);
      if (v !== undefined && v !== null) el.innerHTML = rich(v);
    });
    root.querySelectorAll("[data-c-href]").forEach((el) => {
      const v = get(C, el.dataset.cHref);
      if (v) el.setAttribute("href", safeUrl(v));
    });
    root.querySelectorAll("[data-c-src]").forEach((el) => {
      const v = get(C, el.dataset.cSrc);
      if (v) el.setAttribute("src", safeUrl(v));
    });
    root.querySelectorAll("[data-c-aria]").forEach((el) => {
      const v = get(C, el.dataset.cAria);
      if (v) el.setAttribute("aria-label", String(v).replace(/\n/g, " "));
    });
    root.querySelectorAll("[data-c-ph]").forEach((el) => {
      const v = get(C, el.dataset.cPh);
      if (v !== undefined) el.setAttribute("placeholder", v);
    });
    // hidden only when explicitly switched off (missing settings count as "show")
    root.querySelectorAll("[data-c-show]").forEach((el) => {
      el.hidden = get(C, el.dataset.cShow) === false;
    });
  }

  function apply(C) {
    if (!C || typeof C !== "object") return;
    current = C;
    window.SITE = C;
    applyTheme(C.theme);
    applyLogo(C.site && C.site.logo);
    applyMeta(C);
    bind(C);
    renderers.forEach((fn) => {
      try { fn(C); } catch (e) { console.error("Render failed:", e); }
    });
  }

  /* Public API for page scripts */
  window.Content = {
    get: (path) => get(current, path),
    rich,
    esc: escHtml,
    safeUrl,
    bind: (root) => current && bind(current, root),
    onReady(fn) {
      renderers.push(fn);
      if (current) { try { fn(current); } catch (e) { console.error("Render failed:", e); } }
    },
    isPreview,
  };

  /* Admin live preview: the admin posts the draft into this iframe */
  if (isPreview) {
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== "css-preview") return;
      apply(e.data.content);
    });
    try {
      const draft = JSON.parse(localStorage.getItem("css-admin-draft") || "null");
      if (draft) apply(draft);
    } catch (e) {}
    if (window.parent !== window) window.parent.postMessage({ type: "css-preview-ready" }, location.origin);
    if (current) return;
  }

  /* 1. cached copy, applied immediately so there's no flash of old text */
  let cachedText = null;
  try {
    cachedText = localStorage.getItem(CACHE_KEY);
    if (cachedText && !isPreview) apply(JSON.parse(cachedText));
  } catch (e) { cachedText = null; }

  /* 2. fresh copy from the server, with any settings it's missing filled in from content.json
        (content published before a new setting existed keeps working) */
  function fillDefaults(target, defaults) {
    if (!defaults || typeof defaults !== "object" || Array.isArray(defaults)) return target;
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in target)) target[k] = v;
      else if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) fillDefaults(target[k], v);
    }
    return target;
  }

  async function load() {
    const getJson = async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      return res.json();
    };
    const [published, defaults] = await Promise.all([
      getJson("/api/content").catch(() => null),
      getJson("content.json").catch(() => null),
    ]);
    if (!published && !defaults) { console.error("Could not load site content"); return; }
    const merged = published ? fillDefaults(published, defaults) : defaults;
    const text = JSON.stringify(merged);
    if (text !== cachedText) {
      try { localStorage.setItem(CACHE_KEY, text); } catch (e) {}
      if (!isPreview || !current) apply(merged);
    }
  }
  load();
})();
