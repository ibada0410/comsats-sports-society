/* Shared behaviour for every page: intro loader, page wipe, nav, reveal, progress. */

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const root = document.documentElement;

/* ---------- Intro loader: on your marks, get set, go ---------- */

/* Pictogram athletes. Limbs are nested groups so CSS can rotate them around their joints. */
const INTRO_BATSMAN = `
  <svg class="ath ath-bat" viewBox="0 0 200 240" aria-hidden="true">
    <g class="fig">
      <path d="M95 140 L80 182 L66 224"/>
      <path d="M95 140 L125 180 L142 224"/>
      <path d="M95 140 L102 78"/>
      <circle class="head" cx="107" cy="52" r="16"/>
      <path class="visor" d="M110 44 L127 48"/>
      <g class="bat-arms">
        <path d="M102 80 L118 106 L130 126"/>
        <path class="handle" d="M130 126 L138 142"/>
        <path class="blade" d="M138 142 L160 198"/>
      </g>
    </g>
    <circle id="batPoint" cx="156" cy="186" r="1" fill="none" stroke="none"/>
  </svg>`;

const INTRO_FOOTBALLER = `
  <svg class="ath ath-foot" viewBox="0 0 200 240" aria-hidden="true">
    <g transform="translate(200 0) scale(-1 1)">
      <g class="fig ath-kicker">
        <g class="arm-a"><path d="M98 76 L74 100 L60 120"/></g>
        <path d="M100 132 L92 178 L84 224"/>
        <path d="M100 132 L98 72"/>
        <circle class="head" cx="96" cy="48" r="16"/>
        <g class="arm-b"><path d="M98 76 L122 98 L142 92"/></g>
        <g class="thigh">
          <path d="M100 132 L116 178"/>
          <g class="shin"><path d="M116 178 L122 222 L136 224"/></g>
        </g>
      </g>
      <circle id="kickPoint" cx="150" cy="218" r="1" fill="none" stroke="none"/>
    </g>
  </svg>`;

const INTRO_RUNNER = `
  <svg viewBox="0 0 100 110" aria-hidden="true">
    <g class="ab"><path d="M58 28 L46 44 L34 40"/></g>
    <g class="lb"><path d="M48 58 L36 80"/><g class="sb"><path d="M36 80 L22 90"/></g></g>
    <path d="M48 58 L60 24"/>
    <circle class="head" cx="66" cy="12" r="9"/>
    <g class="la"><path d="M48 58 L62 80"/><g class="sa"><path d="M62 80 L56 102"/></g></g>
    <g class="aa"><path d="M58 28 L72 42 L84 32"/></g>
  </svg>`;

function introGoal() {
  let net = "";
  for (let x = 20; x < 152; x += 14) net += `M${x} 10 L${x + 8} 94 `;
  for (let y = 22; y < 96; y += 14) net += `M10 ${y} H150 `;
  return `
    <div class="goal-wrap">
      <svg class="goal" viewBox="0 0 160 100" aria-hidden="true">
        <path class="net" d="${net}"/>
        <path class="frame" d="M6 98 V6 H154 V98"/>
      </svg>
      <span class="chip chip-goal">${esc(Content.get("loader.goal") ?? "Goal!")}</span>
    </div>`;
}

function buildIntroScene(loader) {
  $(".track", loader).insertAdjacentHTML("beforeend", INTRO_BATSMAN + INTRO_FOOTBALLER);
  $(".runner", loader).innerHTML = INTRO_RUNNER;
  $(".loader-stage", loader).insertAdjacentHTML("beforeend", `
    ${introGoal()}
    <span class="chip chip-six">${esc(Content.get("loader.six") ?? "Six!")}</span>
    <div class="loader-crest"><img src="${esc(Content.safeUrl(Content.get("site.logo")) || "assets/logo.png")}" alt="" /></div>
    ${'<span class="ball ball-cricket"></span>'.repeat(4)}
    ${'<span class="ball ball-foot"></span>'.repeat(4)}
    ${'<svg class="burst" viewBox="0 0 60 60"><path d="M30 4V16M30 44V56M4 30H16M44 30H56M11 11L19 19M41 41L49 49M49 11L41 19M11 49L19 41"/></svg>'.repeat(2)}`);
}

/* Ball flights, timed to the CSS limb animations (ms from the start of the intro) */
function playIntroBalls(loader) {
  const W = innerWidth, H = innerHeight;
  const center = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
  const bez = (a, c, b, t) => ({ x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y });
  const easeOut = (t) => 1 - (1 - t) ** 2.2;

  // keys: [{t, x, y, o?, r?}] on one timeline of `total` ms
  const run = (els, keys, total) => els.forEach((el, i) => {
    const frames = keys.map((k) => ({
      offset: k.t / total,
      opacity: (k.o ?? 1) * (1 - i * 0.24),
      transform: `translate(${k.x}px, ${k.y}px) translate(-50%, -50%) rotate(${k.r || 0}deg) scale(${1 - i * 0.16})`,
    }));
    el.animate(frames, { duration: total, delay: i * 24, fill: "both", easing: "linear" });
  });
  const flight = (from, ctrl, to, t0, t1, spin = 0) => Array.from({ length: 19 }, (_, i) => {
    const p = easeOut(i / 18);
    return { t: t0 + (t1 - t0) * (i / 18), ...bez(from, ctrl, to, p), r: spin * p };
  });
  const burst = (el, at, delay) => el.animate(
    [{ transform: `translate(${at.x}px, ${at.y}px) translate(-50%, -50%) scale(.3)`, opacity: 1 },
     { transform: `translate(${at.x}px, ${at.y}px) translate(-50%, -50%) scale(1.5)`, opacity: 0 }],
    { duration: 380, delay, fill: "both", easing: "ease-out" });

  const bat = center($("#batPoint", loader));
  const kick = center($("#kickPoint", loader));
  const goalR = $(".goal", loader).getBoundingClientRect();
  const goal = { x: goalR.left + goalR.width * 0.55, y: goalR.top + goalR.height * 0.45 };
  const [b1, b2] = $$(".burst", loader);

  // cricket: bowled in, bounces, hit for six off the top-right
  const bowlFrom = { x: Math.min(W * 0.6, bat.x + 520), y: bat.y - 50 };
  run($$(".ball-cricket", loader), [
    { t: 0, ...bowlFrom, o: 0 },
    { t: 430, ...bowlFrom, o: 0 },
    { t: 450, ...bowlFrom },
    { t: 660, x: bat.x + (bowlFrom.x - bat.x) * 0.35, y: bat.y + 14 },
    { t: 800, ...bat },
    ...flight(bat, { x: bat.x + W * 0.38, y: -H * 0.22 }, { x: W + 60, y: H * 0.1 }, 800, 1500, 900).slice(1),
  ], 1500);
  burst(b1, bat, 780);

  // football: sits at the boot, struck at 1220ms, curls into the top-left net
  run($$(".ball-foot", loader), [
    { t: 0, ...kick },
    { t: 1220, ...kick },
    ...flight(kick, { x: (kick.x + goal.x) / 2, y: Math.min(kick.y, goal.y) - H * 0.28 }, goal, 1220, 1900, -1080).slice(1),
    { t: 1980, x: goal.x - 6, y: goal.y + 14, r: -1100 },
  ], 1980);
  burst(b2, kick, 1200);
}

function runIntro() {
  const loader = $("#loader");
  if (!root.classList.contains("intro") || !loader || Content.get("loader.enabled") === false) {
    root.classList.remove("intro");
    loader?.remove();
    return;
  }
  buildIntroScene(loader);

  const finish = () => {
    if (root.classList.contains("intro-out")) return;
    root.classList.add("intro-out");
    setTimeout(() => { root.classList.remove("intro", "intro-out"); loader.remove(); }, 900);
  };

  const start = () => {
    root.classList.add("intro-go");
    playIntroBalls(loader);
    // stopwatch runs while the sprinter crosses the lane (starts with "Go!")
    const watch = $("#loaderWatch");
    const RUN_START = 1500, RUN_MS = 1000, FINAL = parseFloat(Content.get("loader.time")) || 9.58;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(Math.max((now - t0 - RUN_START) / RUN_MS, 0), 1);
      watch.textContent = (FINAL * p).toFixed(2);
      if (p < 1) requestAnimationFrame(tick);
      else { loader.classList.add("is-done"); setTimeout(finish, 950); }
    };
    requestAnimationFrame(tick);
  };

  // wait for the display font so the calls don't flash in a fallback face (max 1.2s)
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, 1200))]).then(start);
  loader.addEventListener("click", finish);
  document.addEventListener("keydown", (e) => e.key === "Escape" && finish(), { once: true });
}

/* ---------- Page wipe between pages ---------- */
function setupWipe() {
  // inside the admin preview, keep internal links in preview mode and skip transitions
  if (Content.isPreview) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank") return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname) return;
      e.preventDefault();
      url.searchParams.set("preview", "1");
      location.href = url.href;
    });
    return;
  }
  if (root.classList.contains("wipe-in")) {
    try { sessionStorage.removeItem("css-wipe"); } catch (e) {}
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("wipe-out")));
    setTimeout(() => root.classList.remove("wipe-in", "wipe-out"), 700);
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || reduce || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return; // same page (hash links scroll)
    e.preventDefault();
    try { sessionStorage.setItem("css-wipe", "1"); } catch (err) {}
    root.classList.add("wipe-leave");
    setTimeout(() => { location.href = url.href; }, 420);
  });
  // restore if user comes back via bfcache
  window.addEventListener("pageshow", (e) => e.persisted && root.classList.remove("wipe-leave"));
}

/* ---------- Nav ---------- */
function setupNav() {
  const nav = $("#nav");
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  const progress = $("#progress");

  const setOpen = (open) => {
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open);
  };
  toggle.addEventListener("click", () => setOpen(!links.classList.contains("open")));
  links.addEventListener("click", (ev) => ev.target.closest("a") && setOpen(false));
  document.addEventListener("keydown", (ev) => ev.key === "Escape" && setOpen(false));

  const onScroll = () => {
    nav.classList.toggle("is-stuck", window.scrollY > 40);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Menu, footer and social links from the admin ---------- */
const isExternalUrl = (url) => /^https?:/i.test(url);
const anchor = (label, url, cls = "") =>
  `<a href="${esc(Content.safeUrl(url))}"${cls ? ` class="${cls}"` : ""}${isExternalUrl(url) ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`;

let navSpy = null;
function renderChrome(C) {
  const pageFile = location.pathname.split("/").pop() || "index.html";
  const nav = C.nav || {};
  $("#navLinks").innerHTML =
    (nav.links || []).map((l) => anchor(l.label, l.link)).join("") +
    (nav.cta ? anchor(nav.cta, nav.ctaLink || "recruitment.html", "btn btn-ink nav-cta") : "");

  const socials = (C.social?.links || []).filter((l) => l.url).map((l) => anchor(l.label, l.url)).join("");
  $$("[data-socials]").forEach((el) => { el.innerHTML = socials; });
  const fl = $("#footerLinks");
  if (fl) fl.innerHTML = (C.footer?.links || []).map((l) => anchor(l.label, l.link)).join("");

  // highlight the current page, and on the home page the section in view
  const navAnchors = $$("#navLinks a");
  navAnchors.forEach((a) => {
    const url = new URL(a.href, location.href);
    const file = url.pathname.split("/").pop() || "index.html";
    a.classList.toggle("is-current", url.origin === location.origin && file === pageFile && !url.hash && file !== "index.html");
  });
  navSpy?.disconnect();
  const hashLinks = navAnchors.filter((a) => {
    const url = new URL(a.href, location.href);
    return url.hash && (url.pathname.split("/").pop() || "index.html") === pageFile;
  });
  if (hashLinks.length) {
    navSpy = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) hashLinks.forEach((a) => a.classList.toggle("is-current", a.hash === `#${e.target.id}`));
      }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    hashLinks.forEach((a) => { const sec = document.getElementById(a.hash.slice(1)); if (sec) navSpy.observe(sec); });
  }
}

/* ---------- Promo popup (e.g. recruitment poster), set in Admin → Popup ---------- */
const POPUP_SEEN = "css-popup-seen";
let popupEl = null, popupTimer = null, popupShown = false;

function popupAllowed(P) {
  const page = root.dataset.page;
  const onPage = { home: P.showOnHome, clubs: P.showOnClubs, recruitment: P.showOnRecruitment }[page];
  if (!P.enabled || !P.image || onPage === false) return false;
  if (Content.isPreview) return new URLSearchParams(location.search).has("popup");
  // someone who clicked the poster is already on their way to the form: don't cover it again this visit
  if (sessionStorage.getItem("css-popup-clicked") === P.image) return false;
  const seen = (() => { try { return JSON.parse(localStorage.getItem(POPUP_SEEN) || "null"); } catch (e) { return null; } })();
  // only suppress if the same poster was closed before (a new poster always shows)
  if (!seen || seen.image !== P.image) return true;
  if (P.frequency === "session") return sessionStorage.getItem(POPUP_SEEN) !== P.image;
  if (P.frequency === "day") return Date.now() - seen.at > 864e5;
  if (P.frequency === "once") return false;
  return true; // "page": every page load
}

function closePopup() {
  if (!popupEl || popupEl.hidden) return;
  const P = window.SITE?.popup || {};
  try {
    localStorage.setItem(POPUP_SEEN, JSON.stringify({ image: P.image, at: Date.now() }));
    sessionStorage.setItem(POPUP_SEEN, P.image);
  } catch (e) {}
  popupEl.classList.remove("is-open");
  setTimeout(() => { popupEl.hidden = true; }, 300);
  document.removeEventListener("keydown", popupKeys);
  popupEl.returnFocus?.focus?.();
}

function popupKeys(e) {
  if (e.key === "Escape") closePopup();
  if (e.key === "Tab") {
    // keep keyboard focus inside the popup
    const items = $$("a, button", popupEl);
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

function renderPopup(C) {
  const P = C.popup || {};
  if (!popupEl) {
    popupEl = h(`<div class="promo" hidden>
        <div class="promo-card" role="dialog" aria-modal="true">
          <button type="button" class="promo-close"><span aria-hidden="true">✕</span></button>
          <a class="promo-link"><img class="promo-img" alt="" /></a>
        </div>
      </div>`);
    document.body.append(popupEl);
    $(".promo-close", popupEl).addEventListener("click", closePopup);
    popupEl.addEventListener("click", (e) => e.target === popupEl && closePopup());
    // clicking the poster counts as "seen" too
    $(".promo-link", popupEl).addEventListener("click", () => {
      const img = window.SITE?.popup?.image;
      try {
        localStorage.setItem(POPUP_SEEN, JSON.stringify({ image: img, at: Date.now() }));
        sessionStorage.setItem(POPUP_SEEN, img);
        sessionStorage.setItem("css-popup-clicked", img);
      } catch (e) {}
    });
  }
  const link = $(".promo-link", popupEl);
  link.href = Content.safeUrl(P.link || "recruitment.html");
  if (/^https?:/i.test(P.link || "")) { link.target = "_blank"; link.rel = "noopener"; } else { link.removeAttribute("target"); }
  $(".promo-img", popupEl).src = Content.safeUrl(P.image || "");
  $(".promo-img", popupEl).alt = P.alt || "";
  $(".promo-card", popupEl).setAttribute("aria-label", P.alt || "Announcement");
  $(".promo-close", popupEl).setAttribute("aria-label", P.closeLabel || "Close");

  if (!popupAllowed(P)) {
    clearTimeout(popupTimer);
    if (!popupEl.hidden) { popupEl.classList.remove("is-open"); popupEl.hidden = true; }
    return;
  }
  if (popupShown && !Content.isPreview) return;

  const open = () => {
    // wait for the intro loader to finish first
    if (root.classList.contains("intro")) { popupTimer = setTimeout(open, 300); return; }
    popupShown = true;
    popupEl.returnFocus = document.activeElement;
    popupEl.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => popupEl.classList.add("is-open")));
    $(".promo-close", popupEl).focus({ preventScroll: true });
    document.addEventListener("keydown", popupKeys);
  };
  clearTimeout(popupTimer);
  if (!popupEl.hidden) return;
  popupTimer = setTimeout(open, Content.isPreview ? 200 : Math.max(0, parseFloat(P.delay) || 0) * 1000);
}

const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

/* ---------- Reveal on scroll (safe to call again after a re-render) ---------- */
let revealIO = null;
function setupReveal() {
  $$(".sec-head, .club-head, .runs li, .join-body, [data-rv]").forEach((el) => el.classList.add("rv"));
  if (Content.isPreview) { $$(".rv").forEach((el) => el.classList.add("in")); return; }
  revealIO ??= new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".rv:not(.in)").forEach((el) => revealIO.observe(el));
}

/* ---------- Jersey (used on home + recruitment) ---------- */
const shirtSVG = (name, num) => `
  <svg viewBox="0 0 200 210" aria-hidden="true">
    <path class="body" d="M66 8 C80 22 120 22 134 8 L184 30 L198 84 L166 96 L160 80 L160 204 L40 204 L40 80 L34 96 L2 84 L16 30 Z"/>
    <path class="trim" d="M70 10 C84 24 116 24 130 10"/>
    <text class="shirt-name" x="100" y="62" textLength="${Math.min(110, Math.max(40, String(name).length * 11))}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
    <text class="shirt-num" x="100" y="160">${esc(num)}</text>
  </svg>`;

/* ---------- Init shared ---------- */
function initSite() {
  runIntro();
  setupWipe();
  setupNav();
  Content.onReady(renderChrome);
  Content.onReady(renderPopup);
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}
initSite();
