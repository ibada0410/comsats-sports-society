/* Storage for site content + uploaded media.
   On Vercel (BLOB_READ_WRITE_TOKEN set) it uses Vercel Blob; locally it uses the .data/ folder. */

import { promises as fs } from "node:fs";
import path from "node:path";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), ".data");
const KEEP_VERSIONS = 40;

let blob = null;
async function sdk() {
  blob ??= await import("@vercel/blob");
  return blob;
}

async function listAll(prefix) {
  if (!useBlob) {
    const dir = path.join(LOCAL, prefix);
    const names = await fs.readdir(dir).catch(() => []);
    return Promise.all(names.map(async (name) => {
      const stat = await fs.stat(path.join(dir, name));
      return { pathname: `${prefix}${name}`, url: `/.data/${prefix}${name}`, size: stat.size, uploadedAt: stat.mtime.toISOString() };
    }));
  }
  const { list } = await sdk();
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: b.url, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function write(pathname, body, contentType) {
  if (!useBlob) {
    const file = path.join(LOCAL, pathname);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    return { url: `/.data/${pathname}`, pathname };
  }
  const { put } = await sdk();
  const res = await put(pathname, body, { access: "public", contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
  return { url: res.url, pathname: res.pathname };
}

async function readText(item) {
  if (!useBlob) return fs.readFile(path.join(LOCAL, item.pathname), "utf8");
  const res = await fetch(item.url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Blob read failed: ${res.status}`);
  return res.text();
}

async function remove(items) {
  if (!items.length) return;
  if (!useBlob) {
    await Promise.all(items.map((i) => fs.unlink(path.join(LOCAL, i.pathname)).catch(() => {})));
    return;
  }
  const { del } = await sdk();
  await del(items.map((i) => i.url));
}

/* ---------- content versions: content/<timestamp>.json (newest = live) ---------- */
const versionTime = (item) => Number(item.pathname.match(/content\/(\d+)\.json$/)?.[1] || 0);

export async function listVersions() {
  const items = (await listAll("content/")).filter((i) => versionTime(i));
  return items.sort((a, b) => versionTime(b) - versionTime(a)).map((i) => ({ ...i, id: String(versionTime(i)), savedAt: new Date(versionTime(i)).toISOString() }));
}

export async function readLatestContent() {
  const [latest] = await listVersions();
  return latest ? readText(latest) : null;
}

export async function readVersion(id) {
  const item = (await listVersions()).find((v) => v.id === String(id));
  return item ? readText(item) : null;
}

export async function saveContent(json) {
  const id = Date.now();
  await write(`content/${id}.json`, json, "application/json");
  const versions = await listVersions();
  await remove(versions.slice(KEEP_VERSIONS));
  return { id: String(id), savedAt: new Date(id).toISOString() };
}

/* ---------- media ---------- */
export async function saveMedia(filename, buffer, contentType) {
  return write(`media/${filename}`, buffer, contentType);
}

export async function listMedia() {
  const items = await listAll("media/");
  return items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export async function deleteMedia(url) {
  const item = (await listMedia()).find((m) => m.url === url);
  if (!item) return false;
  await remove([item]);
  return true;
}

export const storageMode = useBlob ? "vercel-blob" : "local";
