/* POST /api/upload { name, type, data (base64) } → { url }   (admin only)
   The admin resizes images in the browser first, so uploads stay well under Vercel's 4.5 MB limit. */

import { saveMedia, describe } from "./_lib/store.js";
import { send, requireAuth, body } from "./_lib/http.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX_BYTES = 4_000_000;

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!requireAuth(req, res)) return;

  const { name = "image", type, data } = body(req);
  const ext = TYPES[type];
  if (!ext) return send(res, 400, { error: "Upload a JPG, PNG, WebP, GIF or AVIF image." });
  if (typeof data !== "string") return send(res, 400, { error: "No image data received." });

  const buffer = Buffer.from(data, "base64");
  if (!buffer.length) return send(res, 400, { error: "The image is empty." });
  if (buffer.length > MAX_BYTES) return send(res, 413, { error: "Image is too large. Keep it under 4 MB." });

  const slug = String(name).replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image";
  try {
    const saved = await saveMedia(`${Date.now()}-${slug}.${ext}`, buffer, type);
    return send(res, 200, { ok: true, url: saved.url });
  } catch (err) {
    console.error(err);
    return send(res, 500, { error: `Upload failed. ${describe(err)}` });
  }
}
