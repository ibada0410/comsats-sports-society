/* Local test server: serves the site and runs the /api routes, storing edits in .data/.
   Usage:  ADMIN_PASSWORD=yourpassword npm run dev   → http://localhost:3000  (admin: /admin/)
   On Vercel none of this file is used. */

import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const PORT = Number(process.env.PORT) || 3000;
process.env.ADMIN_PASSWORD ||= "admin";
if (process.env.ADMIN_PASSWORD === "admin") console.log('Local admin password is "admin" (set ADMIN_PASSWORD to change it).');

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".md": "text/plain; charset=utf-8",
};

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  try { return JSON.parse(raw || "{}"); } catch { return raw; }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      const name = url.pathname.slice(5).replace(/[^a-z-]/g, "");
      const file = path.join(ROOT, "api", `${name}.js`);
      await fs.access(file);
      if (["POST", "PUT", "PATCH"].includes(req.method)) req.body = await readBody(req);
      const mod = await import(pathToFileURL(file).href);
      return await mod.default(req, res);
    }

    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT) || /[\\/](api|node_modules)[\\/]/.test(file.slice(ROOT.length) + "/")) throw new Error("forbidden");
    const stat = await fs.stat(file).catch(() => null);
    if (stat?.isDirectory()) file = path.join(file, "index.html");
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(data);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    }
  }
});

server.listen(PORT, () => console.log(`Site:  http://localhost:${PORT}\nAdmin: http://localhost:${PORT}/admin/`));
