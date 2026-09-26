/* GET /api/history        → list of published versions (admin only)
   GET /api/history?id=…   → one version's content (admin only) */

import { listVersions, readVersion } from "./_lib/store.js";
import { send, requireAuth } from "./_lib/http.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed" });
  try {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    if (id) {
      const text = await readVersion(id);
      return text ? send(res, 200, text) : send(res, 404, { error: "Version not found" });
    }
    const versions = await listVersions();
    return send(res, 200, { items: versions.map(({ id, savedAt, size }) => ({ id, savedAt, size })) });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: "Storage error." });
  }
}
