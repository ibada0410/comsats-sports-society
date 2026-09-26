/* Recruitment form: validation + submission to Google Sheets (recruitment.endpoint). Needs site.js. */

const form = $("#applyForm");
const statusEl = $("#formStatus");
const submitBtn = $("#submitBtn");
let submitted = false;

/* ---------- Content-driven parts (re-run when content changes) ---------- */
const options = (placeholder, list) =>
  `<option value="">${esc(placeholder)}</option>` + list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");

function fillSelect(id, placeholder, list) {
  const sel = $(`#${id}`);
  const keep = sel.value;
  sel.innerHTML = options(placeholder, list);
  if (list.includes(keep)) sel.value = keep;
}

function render(C) {
  const R = C.recruitment;
  $("#stepsList").innerHTML = R.steps.map((s) => `<li><b>${esc(s.title)}</b><span>${Content.rich(s.text)}</span></li>`).join("");

  const semesters = Array.from({ length: Math.max(1, parseInt(R.form.semesters, 10) || 8) }, (_, i) => String(i + 1));
  const clubs = C.clubs.map((c) => c.name);
  fillSelect("department", `Select ${R.form.department.toLowerCase()}`, R.departments);
  fillSelect("semester", `Select ${R.form.semester.toLowerCase()}`, semesters);
  fillSelect("preferredClub", "Select a club", clubs);
  fillSelect("secondaryClub", "Select a club", clubs);

  // preselect from a clubs page link (recruitment.html?club=Media%20Club)
  const wanted = new URLSearchParams(location.search).get("club");
  if (wanted && clubs.includes(wanted) && !$("#preferredClub").value) $("#preferredClub").value = wanted;
  syncClubs();

  if (!submitted) {
    $("#closedCard").hidden = R.open !== false;
    form.hidden = R.open === false;
  }
}

// the secondary club can't be the same as the preferred one
function syncClubs() {
  const pref = $("#preferredClub").value;
  $$("#secondaryClub option").forEach((o) => { o.disabled = !!o.value && o.value === pref; });
  if ($("#secondaryClub").value === pref) $("#secondaryClub").value = "";
}
$("#preferredClub").addEventListener("change", syncClubs);

/* ---------- Validation ---------- */
const clean = {
  phone: (v) => v.replace(/[\s-]/g, "").replace(/^\+92/, "0").replace(/^92(?=3)/, "0"),
  reg: (v) => v.trim().toUpperCase().replace(/\s+/g, ""),
};

const rules = {
  name: (v) => (v.trim().length < 3 ? "Enter your full name." : ""),
  contact: (v) => (/^03\d{9}$/.test(clean.phone(v)) ? "" : "Enter an 11-digit mobile number, like 0312 3456789."),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address."),
  regNo: (v) => (/^(FA|SP)\d{2}-[A-Z]{2,5}-\d{2,3}$/.test(clean.reg(v)) ? "" : "Use the format FA23-BCS-045."),
  department: (v) => (v ? "" : "Select your department."),
  semester: (v) => (v ? "" : "Select your semester."),
  preferredClub: (v) => (v ? "" : "Select your preferred club."),
  secondaryClub: (v) => (!v ? "Select a secondary club." : v === $("#preferredClub").value ? "Pick a different club from your preferred one." : ""),
  why: (v) => (v.trim().length < 30 ? `Tell us a bit more (${v.trim().length}/30 characters).` : ""),
};

function check(name) {
  const input = form.elements[name];
  const msg = rules[name](input.value);
  $(`#${name}-err`).textContent = msg;
  input.setAttribute("aria-invalid", msg ? "true" : "false");
  input.closest(".field").classList.toggle("has-error", !!msg);
  return !msg;
}

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("blur", () => input.value && check(name));
  input.addEventListener("input", () => input.closest(".field").classList.contains("has-error") && check(name));
  input.addEventListener("change", () => input.tagName === "SELECT" && check(name));
});

$("#regNo").addEventListener("blur", (e) => { if (e.target.value) e.target.value = clean.reg(e.target.value); });
$("#why").addEventListener("input", (e) => { $("#whyCount").textContent = `${e.target.value.length} / 600`; });

/* ---------- Submit ---------- */
function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.classList.toggle("is-busy", busy);
  $(".btn-label", submitBtn).textContent = busy ? "Submitting…" : (Content.get("recruitment.form.submit") || "Submit application");
}

function showStatus(msg) {
  statusEl.textContent = msg;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  showStatus("");

  const invalid = Object.keys(rules).filter((n) => !check(n));
  if (invalid.length) {
    form.elements[invalid[0]].focus();
    showStatus(`Fix ${invalid.length === 1 ? "the highlighted field" : `the ${invalid.length} highlighted fields`} to submit.`);
    return;
  }

  const f = form.elements;
  const payload = {
    name: f.name.value.trim(),
    contact: clean.phone(f.contact.value),
    email: f.email.value.trim().toLowerCase(),
    regNo: clean.reg(f.regNo.value),
    department: f.department.value,
    semester: f.semester.value,
    preferredClub: f.preferredClub.value,
    secondaryClub: f.secondaryClub.value,
    why: f.why.value.trim(),
    website: f.website.value, // spam trap
  };

  const endpoint = Content.get("recruitment.endpoint");
  if (!endpoint) {
    showStatus("The form isn't connected to the society's Google Sheet yet, so nothing was sent. Add the Google Sheet link in Admin → Recruitment (see apps-script/SETUP.md).");
    return;
  }

  setBusy(true);
  try {
    // text/plain keeps this a "simple" request, so Google Apps Script accepts it without a CORS preflight
    const res = await fetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (data.ok) return showSuccess(payload);
    if (data.error === "duplicate") {
      showStatus(`An application with registration number ${payload.regNo} has already been submitted. DM us on Instagram if you need to change it.`);
    } else {
      showStatus("Your application didn't go through. Check your connection and submit again.");
    }
  } catch (err) {
    showStatus("Your application didn't go through. Check your connection and submit again.");
  } finally {
    setBusy(false);
  }
});

function fillTemplate(tpl, p) {
  const vars = { first: p.name.split(/\s+/)[0], name: p.name, club: p.preferredClub, second: p.secondaryClub, contact: p.contact, email: p.email, regNo: p.regNo };
  return String(tpl || "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function showSuccess(p) {
  submitted = true;
  const R = window.SITE.recruitment;
  const first = p.name.split(/\s+/)[0].toUpperCase().slice(0, 10);
  const num = parseInt(p.regNo.split("-").pop(), 10) || p.semester;
  $("#successShirt").innerHTML = shirtSVG(first, num);
  $("#successTitle").textContent = fillTemplate(R.successTitle, p);
  $("#successText").textContent = fillTemplate(R.successText, p);
  form.hidden = true;
  const s = $("#success");
  s.hidden = false;
  s.focus();
  s.scrollIntoView({ behavior: "smooth", block: "start" });
}

Content.onReady(render);
