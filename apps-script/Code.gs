/**
 * COMSATS Sports Society: recruitment form receiver.
 * Paste this into Extensions → Apps Script of your Google Sheet, then deploy as a Web app.
 * Full steps: SETUP.md
 */

const SHEET_NAME = "Applications";
// Optional: get an email for every new application. Leave "" to turn off.
const NOTIFY_EMAIL = "";

const HEADERS = [
  "Submitted at", "Name", "Contact number", "Email", "Registration number",
  "Department", "Semester", "Preferred club", "Secondary club", "Why join CSS",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");

    // spam trap filled in: pretend it worked, save nothing
    if (d.website) return reply({ ok: true });

    const required = ["name", "contact", "email", "regNo", "department", "semester", "preferredClub", "secondaryClub", "why"];
    if (required.some((k) => !String(d[k] || "").trim())) return reply({ ok: false, error: "missing" });

    const sheet = getSheet();
    const regNo = String(d.regNo).trim().toUpperCase();

    // one application per registration number
    const last = sheet.getLastRow();
    if (last > 1) {
      const existing = sheet.getRange(2, 5, last - 1, 1).getValues().flat().map((v) => String(v).toUpperCase());
      if (existing.includes(regNo)) return reply({ ok: false, error: "duplicate" });
    }

    sheet.appendRow([
      new Date(),
      safe(d.name), safe(d.contact), safe(d.email), safe(regNo),
      safe(d.department), safe(d.semester), safe(d.preferredClub), safe(d.secondaryClub), safe(d.why),
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        `New CSS application: ${d.name} (${d.preferredClub})`,
        `${d.name} · ${regNo} · ${d.department}, semester ${d.semester}\n` +
        `Preferred: ${d.preferredClub} · Secondary: ${d.secondaryClub}\n` +
        `Contact: ${d.contact} · ${d.email}\n\nWhy join CSS:\n${d.why}`
      );
    }
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: "server" });
  } finally {
    lock.releaseLock();
  }
}

// lets you open the web-app URL in a browser to check it's live
function doGet() {
  return reply({ ok: true, message: "CSS recruitment endpoint is running." });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  // keep phone and registration numbers as text so Sheets doesn't drop the leading 0
  sheet.getRange("C:C").setNumberFormat("@");
  sheet.getRange("E:E").setNumberFormat("@");
  return sheet;
}

// stop spreadsheet formula injection (values starting with = + - @)
function safe(v) {
  const s = String(v == null ? "" : v).trim().slice(0, 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
