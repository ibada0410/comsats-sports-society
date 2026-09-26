/* GET    /api/media        → uploaded images (admin only)
   DELETE /api/media?url=…  → delete one image (admin only) */

import { listMedia, deleteMedia, describe } from "./_lib/store.js";
import { send, requireAuth } from "./_lib/http.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  try {
    if (req.method === "GET") return send(res, 200, { items: await listMedia() });
    if (req.method === "DELETE") {
      const url = new URL(req.url, "http://x").searchParams.get("url");
      if (!url) return send(res, 400, { error: "Missing url" });
      const ok = await deleteMedia(url);
      return ok ? send(res, 200, { ok: true }) : send(res, 404, { error: "Image not found" });
    }
    return send(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: describe(err) });
  }
}
