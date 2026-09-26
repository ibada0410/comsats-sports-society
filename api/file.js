/* GET /api/file?p=media/…  → serves an uploaded image (needed when the Blob store is private). */

import { Readable } from "node:stream";
import { openFile, describe } from "./_lib/store.js";

const TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

export default async function handler(req, res) {
  const p = new URL(req.url, "http://x").searchParams.get("p") || "";
  // only uploaded media, never content versions or anything outside media/
  if (!/^media\/[\w.-]+$/.test(p)) {
    res.statusCode = 404;
    return res.end("Not found");
  }
  try {
    const file = await openFile(p);
    if (!file) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", file.contentType || TYPES[p.split(".").pop().toLowerCase()] || "application/octet-stream");
    // uploads never change (every upload gets a new name), so browsers and Vercel's CDN can keep them
    res.setHeader("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (file.body) return res.end(file.body);
    Readable.fromWeb(file.stream).pipe(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(describe(err));
  }
}
