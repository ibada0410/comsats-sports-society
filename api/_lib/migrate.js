/* Upgrades content that was published by an older version of the site.
   Each step runs once per piece of content: after it, "schemaVersion" is bumped,
   so later edits made in the admin are never changed again. */

export const SCHEMA_VERSION = 3;

const SKIP_KEY = /(link|url|href|image|src|photo|logo|endpoint|^id$|icon|status|date|time|frequency)/i;
const LOOKS_URL = /^(https?:|\/|#|mailto:|tel:)|\.html\b/i;

// replace a word in every text value, keeping capitals (club → team, Club → Team, CLUBS → TEAMS)
function replaceWord(obj, find, replace) {
  const re = new RegExp(find, "gi");
  const swap = (m) => {
    if (m === m.toUpperCase()) return replace.toUpperCase();
    if (m[0] === m[0].toUpperCase()) return replace[0].toUpperCase() + replace.slice(1);
    return replace;
  };
  const walk = (o) => {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === "string") {
        if ((!Array.isArray(o) && SKIP_KEY.test(k)) || LOOKS_URL.test(v)) continue;
        o[k] = v.replace(re, swap);
      } else if (v && typeof v === "object") walk(v);
    }
  };
  walk(obj);
}

const STEPS = {
  // v2: the society calls its clubs "teams"
  2(content) {
    replaceWord(content, "club", "team");
  },
  // v3: the "why join CSS" answer no longer needs a 30-character minimum
  3(content) {
    const form = content.recruitment?.form;
    if (form?.whyHint === "At least 30 characters.") form.whyHint = "";
    const messages = content.recruitment?.messages;
    if (messages?.why === "Tell us a bit more ({count}/30 characters).") {
      messages.why = "Tell us a bit about why you want to join.";
    }
  },
};

export function migrate(content) {
  if (!content || typeof content !== "object") return content;
  let v = Number(content.schemaVersion) || 1;
  while (v < SCHEMA_VERSION) {
    v += 1;
    STEPS[v]?.(content);
  }
  content.schemaVersion = SCHEMA_VERSION;
  return content;
}

export function migrateText(text) {
  try { return JSON.stringify(migrate(JSON.parse(text))); } catch { return text; }
}
