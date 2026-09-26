/* Clubs page: renders the clubs from content.js. Needs site.js. */

let clubSpy = null;

function render(C) {
  const p = C.clubsPage;

  $("#clubIndex").innerHTML = C.clubs.map(
    (c) => `
      <li>
        <a class="board-cell" href="#${esc(c.id)}" data-club="${esc(c.id)}">
          <span class="board-code">${esc(c.code)}</span>
          <span class="board-name">${esc(c.name)}</span>
        </a>
      </li>`
  ).join("");

  $("#clubPanels").innerHTML = C.clubs.map(
    (c, i) => `
      <section class="club-panel ${i % 2 ? "is-alt" : ""}" id="${esc(c.id)}" aria-labelledby="${esc(c.id)}-title">
        <div class="wrap club-panel-grid">
          <div class="club-code-wrap" data-rv>
            <span class="club-code" aria-hidden="true">${esc(c.code)}</span>
            <span class="club-of">${esc(String(p.countLabel || "Club {n} of {total}").replace("{n}", i + 1).replace("{total}", C.clubs.length))}</span>
            ${c.image ? `<img class="club-image" src="${esc(Content.safeUrl(c.image))}" alt="${esc(c.name)}" loading="lazy" />` : ""}
          </div>
          <div class="club-body" data-rv>
            <p class="kicker">${esc(c.tagline)}</p>
            <h2 class="h2" id="${esc(c.id)}-title">${esc(c.name)}</h2>
            <p class="club-desc">${Content.rich(c.description)}</p>
            <div class="club-cols">
              <div>
                <h3 class="side-label">${esc(p.doesLabel)}</h3>
                <ul class="ticks">${(c.does || []).map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
              </div>
              <div>
                <h3 class="side-label">${esc(p.fitLabel)}</h3>
                <ul class="tags">${(c.fit || []).map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
              </div>
            </div>
            <a class="btn btn-ink" href="recruitment.html?club=${encodeURIComponent(c.name)}">${esc(p.applyLabel)} ${esc(c.name)} <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </section>`
  ).join("");

  // highlight the club in view
  clubSpy?.disconnect();
  const cells = $$("#clubIndex .board-cell");
  clubSpy = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) cells.forEach((a) => a.classList.toggle("is-current", a.dataset.club === e.target.id));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$(".club-panel").forEach((panel) => clubSpy.observe(panel));

  setupReveal();

  // jump to #club after the panels exist
  if (location.hash && !render.jumped) {
    render.jumped = true;
    document.getElementById(location.hash.slice(1))?.scrollIntoView();
  }
}

Content.onReady(render);
