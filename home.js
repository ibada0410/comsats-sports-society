/* Home page: renders content (content.js) into the page. Needs site.js.
   render() runs again whenever the content changes, so it only replaces markup;
   event listeners are attached once in setup(). */

const eventTime = (e) => new Date(`${e.date}T${e.time || "09:00"}:00`);
const isExternal = (url) => /^https?:/.test(url);
const linkAttrs = (url) => `href="${esc(Content.safeUrl(url))}"${isExternal(url) ? ' target="_blank" rel="noopener"' : ""}`;

/* Line pictograms (48×48, stroke only). Pick one per sport in the admin. */
const SPORT_ICONS = {
  cricket: '<path d="M31 5l8 8-20 20-8-8z"/><path d="M13 31l-7 7"/><circle cx="36" cy="37" r="5"/>',
  football: '<circle cx="24" cy="24" r="18"/><path d="M24 16l7.6 5.5-2.9 9h-9.4l-2.9-9z"/><path d="M24 16V6M31.6 21.5L41 18M28.7 30.5L34 39M19.3 30.5L14 39M16.4 21.5L7 18"/>',
  hockey: '<path d="M16 5l12 29c2 4 6 6 11 4l2-1"/><circle cx="15" cy="39" r="3.5"/>',
  futsal: '<path d="M5 36V12h38v24"/><path d="M5 12l6 6h26l6-6M11 18v18M37 18v18"/><circle cx="24" cy="33" r="5"/>',
  volleyball: '<circle cx="24" cy="24" r="18"/><path d="M24 24c-6-8-13-10-17-8M24 24c10-2 15 2 17 6M24 24c0 8-3 14-8 17M24 6c5 6 6 12 0 18"/>',
  basketball: '<circle cx="24" cy="24" r="18"/><path d="M6 24h36M24 6v36M11 11c7 7 7 19 0 26M37 11c-7 7-7 19 0 26"/>',
  tugofwar: '<path d="M3 26c5-6 9 6 14 0s9-6 14 0 9 6 14 0"/><path d="M24 12v12M24 12l8 4-8 4"/>',
  badminton: '<circle cx="24" cy="38" r="5"/><path d="M19.5 36L12 8h24l-7.5 28M20 9l2 26M28 9l-2 26M13 18h22"/>',
  tabletennis: '<circle cx="20" cy="20" r="13"/><path d="M28 30l3-3 10 10-3 3z"/><circle cx="39" cy="10" r="3"/>',
  tennis: '<ellipse cx="19" cy="19" rx="11" ry="14" transform="rotate(-45 19 19)"/><path d="M11 19h16M19 11v16M27 27l12 12"/><circle cx="39" cy="11" r="4"/>',
  athletics: '<circle cx="24" cy="27" r="15"/><path d="M24 27v-9M20 5h8M24 5v7M36 14l3-3"/>',
  chess: '<circle cx="24" cy="11" r="5"/><path d="M19 19h10l-2 14h-6zM14 41h20l-2-6H16z"/>',
  swimming: '<circle cx="34" cy="14" r="4"/><path d="M8 22l12-6 8 8M4 34c4-3 8-3 12 0s8 3 12 0 8-3 12 0 4 2 4 2M4 42c4-3 8-3 12 0s8 3 12 0 8-3 12 0"/>',
  squash: '<ellipse cx="18" cy="16" rx="10" ry="12" transform="rotate(-35 18 16)"/><path d="M25 25l14 16"/><circle cx="38" cy="12" r="3"/>',
  kabaddi: '<circle cx="16" cy="9" r="4"/><circle cx="34" cy="9" r="4"/><path d="M16 14v12l-6 14M16 20l10 4M34 14v12l6 14M34 20l-8 4M16 26h18"/>',
  trophy: '<path d="M16 6h16v10a8 8 0 0 1-16 0zM16 10H8c0 6 4 9 8 9M32 10h8c0 6-4 9-8 9M24 24v8M16 40h16M18 32h12v8H18z"/>',
};

let fixtureFilter = "upcoming";
let sportFilter = "all";
let countdownTimer = null;

/* ---------- Next up + countdown ---------- */
function renderNextUp(C) {
  const box = $("#nextUp");
  const t = C.home.nextUp;
  const next = C.home.fixtures.items
    .filter((e) => e.status === "upcoming" && eventTime(e) > Date.now())
    .sort((a, b) => eventTime(a) - eventTime(b))[0];
  clearInterval(countdownTimer);

  if (!next) {
    box.innerHTML = `
      <div class="nextup-head"><span>${esc(t.emptyLabel)}</span></div>
      <div class="nextup-body">
        <p class="nextup-title">${esc(t.emptyTitle)}</p>
        <p class="nextup-meta">${esc(t.emptyText)}</p>
        <a ${linkAttrs(C.social.instagram)}>${esc(t.emptyLink)}</a>
      </div>`;
    return;
  }

  const d = eventTime(next);
  box.innerHTML = `
    <div class="nextup-head">
      <span class="live"><span class="dot" aria-hidden="true"></span>${esc(t.label)}</span>
      <span>${esc(next.tag)}</span>
    </div>
    <div class="nextup-body">
      <p class="nextup-title">${esc(next.title)}</p>
      <p class="nextup-meta">${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} · ${esc(next.venue)}</p>
      <div class="clock" role="timer" aria-label="Time until ${esc(next.title)}">
        <div><b data-u="d">00</b><small>${esc(t.days)}</small></div>
        <div><b data-u="h">00</b><small>${esc(t.hours)}</small></div>
        <div><b data-u="m">00</b><small>${esc(t.minutes)}</small></div>
        <div><b data-u="s">00</b><small>${esc(t.seconds)}</small></div>
      </div>
      ${next.link ? `<a ${linkAttrs(next.link)}>${esc(next.linkText || t.detailsLink)}</a>` : ""}
    </div>`;

  const cells = Object.fromEntries($$("[data-u]", box).map((el) => [el.dataset.u, el]));
  const tick = () => {
    const ms = Math.max(0, d - Date.now());
    cells.d.textContent = pad(Math.floor(ms / 864e5));
    cells.h.textContent = pad(Math.floor(ms / 36e5) % 24);
    cells.m.textContent = pad(Math.floor(ms / 6e4) % 60);
    cells.s.textContent = pad(Math.floor(ms / 1e3) % 60);
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

/* ---------- What the society runs ---------- */
function renderRuns(C) {
  $("#runsList").innerHTML = C.home.society.items
    .map((r) => `<li><h3>${Content.rich(r.title)}</h3><p>${Content.rich(r.text)}</p></li>`)
    .join("");
}

/* ---------- Sports ---------- */
function renderSports(C) {
  const items = C.home.sports.items;
  const names = items.map((s) => `<span>${esc(s.name)}</span>`).join("");
  $("#indexTrack").innerHTML = names + names;

  const cats = [...new Set(items.map((s) => s.category).filter(Boolean))];
  if (sportFilter !== "all" && !cats.includes(sportFilter)) sportFilter = "all";
  $("#sportFilter").innerHTML = [["all", C.home.sports.allLabel], ...cats.map((c) => [c, c])]
    .map(([v, label]) => `<button class="tab ${v === sportFilter ? "is-active" : ""}" data-cat="${esc(v)}" aria-pressed="${v === sportFilter}">${esc(label)}</button>`)
    .join("");

  $("#sportGrid").innerHTML = items.map(
    (s, i) => `
      <li class="sport rv ${sportFilter !== "all" && s.category !== sportFilter ? "is-hidden" : ""}" data-cat="${esc(s.category)}" style="--d:${(i % 4) * 0.06}s">
        <div class="sport-top">
          <span class="sport-cat">${esc(s.category)}</span>
          <svg class="sport-icon" viewBox="0 0 48 48" aria-hidden="true">${SPORT_ICONS[s.icon] || SPORT_ICONS.trophy}</svg>
        </div>
        <div>
          <h3>${esc(s.name)}</h3>
          <p>${esc(s.format)}</p>
        </div>
      </li>`
  ).join("");
}

/* The strip speeds up and leans with scroll velocity */
function setupStripMotion() {
  const track = $("#indexTrack");
  if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let x = 0, last = window.scrollY, vel = 0;
  track.style.animation = "none";
  const loop = () => {
    const half = track.scrollWidth / 2;
    const y = window.scrollY;
    vel += ((y - last) - vel) * 0.12;
    last = y;
    x -= 0.6 + Math.abs(vel) * 0.35;
    if (half && -x >= half) x += half;
    const skew = Math.max(-12, Math.min(12, vel * -0.4));
    track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function setActiveTab(group, btn) {
  $$(".tab", group).forEach((t) => {
    const on = t === btn;
    t.classList.toggle("is-active", on);
    t.setAttribute("aria-pressed", on);
  });
}

/* ---------- Fixtures ---------- */
function renderFixtures(C) {
  const f = C.home.fixtures;
  const list = f.items
    .filter((e) => fixtureFilter === "all" || e.status === fixtureFilter)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1;
      return a.status === "upcoming" ? eventTime(a) - eventTime(b) : eventTime(b) - eventTime(a);
    });

  if (!list.length) {
    $("#fxList").innerHTML = `<li class="fx-empty">${Content.rich(f.emptyText)}</li>`;
    return;
  }

  $("#fxList").innerHTML = list
    .map((e) => {
      const d = eventTime(e);
      const status = e.status === "upcoming"
        ? `<span class="fx-status"><span class="dot" aria-hidden="true"></span>${esc(f.upcomingLabel)}</span>`
        : `<span class="fx-status ft"><b>FT</b>${esc(f.resultLabel)}</span>`;
      const Tag = e.link ? "a" : "div";
      return `
        <li>
          <${Tag} class="fx" ${e.link ? linkAttrs(e.link) : ""}>
            <div class="fx-date"><b>${pad(d.getDate())}</b><span>${MONTHS[d.getMonth()]} ${d.getFullYear()}</span></div>
            <div class="fx-main">
              <span class="fx-tag">${esc(e.tag)}</span>
              <h3>${esc(e.title)}</h3>
              <p>${Content.rich(e.description)}</p>
            </div>
            <div class="fx-venue"><b>${esc(e.venue)}</b>${e.time && e.status === "upcoming" ? esc(e.time) : ""}</div>
            ${status}
            <span class="fx-go" aria-hidden="true">→</span>
          </${Tag}>
        </li>`;
    })
    .join("");
}

/* ---------- Council ---------- */
function renderSquad(C) {
  $("#squadGrid").innerHTML = C.home.council.members.map(
    (m, i) => `
      <li class="player rv" style="--d:${(i % 4) * 0.08}s">
        <div class="shirt ${m.photo ? "has-photo" : ""}">
          ${m.photo
            ? `<img src="${esc(Content.safeUrl(m.photo))}" alt="${esc(m.name)}" loading="lazy" /><span class="photo-num">${esc(m.number)}</span>`
            : shirtSVG(m.shirt || String(m.name).split(" ").pop().toUpperCase(), m.number ?? "")}
        </div>
        <p class="player-role">${esc(m.role)}</p>
        <h3 class="player-name">${esc(m.name)}</h3>
      </li>`
  ).join("");
}

/* ---------- Clubs scoreboard ---------- */
function renderClubBoard(C) {
  $("#clubBoard").innerHTML = C.clubs.map(
    (c, i) => `
      <li class="rv" style="--d:${i * 0.07}s">
        <a class="board-cell" href="clubs.html#${esc(c.id)}">
          <span class="board-code">${esc(c.code)}</span>
          <span class="board-name">${esc(c.name)}</span>
          <span class="board-line">${esc(c.tagline)}</span>
        </a>
      </li>`
  ).join("");
}

/* ---------- Gallery ---------- */
function renderGallery(C) {
  const g = C.home.gallery;
  $("#galGrid").innerHTML = g.items.map((item, i) =>
    item.src
      ? `<figure class="gal rv" style="--d:${(i % 3) * 0.06}s">
           <img src="${esc(Content.safeUrl(item.src))}" alt="${esc(item.caption)}" loading="lazy" />
           <button type="button" data-src="${esc(Content.safeUrl(item.src))}" data-alt="${esc(item.caption)}" aria-label="Open photo: ${esc(item.caption)}"></button>
           ${item.caption ? `<figcaption>${esc(item.caption)}</figcaption>` : ""}
         </figure>`
      : `<figure class="gal gal-empty rv" style="--d:${(i % 3) * 0.06}s" data-tag="${esc(g.emptyTag)}">
           <img class="gal-crest" src="${esc(Content.safeUrl(C.site.logo))}" alt="" />
           <figcaption>${esc(item.caption)}</figcaption>
         </figure>`
  ).join("");
}

/* ---------- Setup (once) ---------- */
function setup() {
  $("#sportFilter").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".tab");
    if (!btn) return;
    sportFilter = btn.dataset.cat;
    setActiveTab($("#sportFilter"), btn);
    $$(".sport").forEach((el) => el.classList.toggle("is-hidden", sportFilter !== "all" && el.dataset.cat !== sportFilter));
  });

  $("#fxTabs").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".tab");
    if (!btn) return;
    fixtureFilter = btn.dataset.f;
    setActiveTab($("#fxTabs"), btn);
    renderFixtures(window.SITE);
  });

  const box = $("#lightbox");
  const img = $("#lightboxImg");
  let opener = null;
  const close = () => { box.hidden = true; opener?.focus(); };
  $("#galGrid").addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-src]");
    if (!btn) return;
    opener = btn;
    img.src = btn.dataset.src;
    img.alt = btn.dataset.alt;
    box.hidden = false;
    $("#lightboxClose").focus();
  });
  $("#lightboxClose").addEventListener("click", close);
  box.addEventListener("click", (ev) => ev.target === box && close());
  document.addEventListener("keydown", (ev) => ev.key === "Escape" && !box.hidden && close());

  setupStripMotion();
}

function render(C) {
  renderNextUp(C);
  renderRuns(C);
  renderSports(C);
  renderFixtures(C);
  renderSquad(C);
  renderClubBoard(C);
  renderGallery(C);
  setupReveal();
}

setup();
Content.onReady(render);
