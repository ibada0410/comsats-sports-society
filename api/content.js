/* GET  /api/content  → the live site content (public)
   PUT  /api/content  → publish new content (admin only) */

import { readLatestContent, saveContent, describe } from "./_lib/store.js";
import { send, requireAuth, body } from "./_lib/http.js";

const MAX_BYTES = 1_500_000;
const REQUIRED = ["site", "theme", "social", "nav", "home", "clubsPage", "clubs", "recruitment"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      let text = null;
      try { text = await readLatestContent(); }
      catch (err) { console.error(err); return send(res, 503, { error: describe(err) }); }
      // nothing published yet → the site falls back to the bundled content.json
      if (!text) return send(res, 404, { error: "No published content yet" });
      return send(res, 200, text, { "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=60" });
    }

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;
      const content = body(req).content;
      if (!content || typeof content !== "object" || Array.isArray(content)) return send(res, 400, { error: "Content must be an object." });
      const missing = REQUIRED.filter((k) => !(k in content));
      if (missing.length) return send(res, 400, { error: `Content is missing: ${missing.join(", ")}` });
      const json = JSON.stringify(content, null, 2);
      if (Buffer.byteLength(json) > MAX_BYTES) return send(res, 413, { error: "Content is too large (over 1.5 MB)." });
      const version = await saveContent(json);
      return send(res, 200, { ok: true, version });
    }

    res.setHeader("Allow", "GET, PUT");
    return send(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: describe(err) });
  }
}
