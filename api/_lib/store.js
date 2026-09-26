/* Storage for site content + uploaded media.
   On Vercel it uses Vercel Blob (public or private stores both work); locally it uses the .data/ folder. */

import { promises as fs } from "node:fs";
import path from "node:path";

// newer Vercel connections set BLOB_STORE_ID (+ an automatic OIDC token); older ones set BLOB_READ_WRITE_TOKEN
const useBlob = !!(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const onVercel = !!process.env.VERCEL;
const LOCAL = path.join(process.cwd(), ".data");
const KEEP_VERSIONS = 40;

export class StorageError extends Error {}

let blob = null;
async function sdk() {
  if (!useBlob && onVercel) {
    throw new StorageError("Vercel Blob isn't connected to this project (no BLOB_STORE_ID or BLOB_READ_WRITE_TOKEN). In Vercel open Storage → your Blob store → Connect Project, then redeploy.");
  }
  blob ??= await import("@vercel/blob");
  return blob;
}

/* Public stores give direct links; private stores are read through /api/file.
   The store type is detected once (or set BLOB_ACCESS=public|private to skip detection). */
let access = ["public", "private"].includes(process.env.BLOB_ACCESS) ? process.env.BLOB_ACCESS : null;
async function storeAccess() {
  if (access) return access;
  const { put } = await sdk();
  const probe = { access: "public", contentType: "text/plain", addRandomSuffix: false, allowOverwrite: true };
  try {
    await put("system/access-probe.txt", "ok", probe);
    access = "public";
  } catch (publicErr) {
    try {
      await put("system/access-probe.txt", "ok", { ...probe, access: "private" });
      access = "private";
    } catch {
      throw publicErr;
    }
  }
  return access;
}

const fileUrl = (pathname) => `/api/file?p=${encodeURIComponent(pathname)}`;
const viewUrl = (b, acc) => (acc === "private" ? fileUrl(b.pathname) : b.url);

async function listAll(prefix) {
  if (!useBlob && !onVercel) {
    const dir = path.join(LOCAL, prefix);
    const names = await fs.readdir(dir).catch(() => []);
    return Promise.all(names.map(async (name) => {
      const stat = await fs.stat(path.join(dir, name));
      return { pathname: `${prefix}${name}`, url: `/.data/${prefix}${name}`, size: stat.size, uploadedAt: stat.mtime.toISOString() };
    }));
  }
  const { list } = await sdk();
  const acc = await storeAccess();
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ pathname: b.pathname, url: viewUrl(b, acc), size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

async function write(pathname, body, contentType) {
  if (!useBlob && !onVercel) {
    const file = path.join(LOCAL, pathname);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, body);
    return { url: `/.data/${pathname}`, pathname };
  }
  const { put } = await sdk();
  const acc = await storeAccess();
  const res = await put(pathname, body, { access: acc, contentType, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
  return { url: viewUrl(res, acc), pathname: res.pathname };
}

/* Stream one stored file (used by /api/file for private stores). */
export async function openFile(pathname) {
  if (!useBlob && !onVercel) {
    const file = path.join(LOCAL, pathname);
    if (!file.startsWith(LOCAL)) return null;
    const data = await fs.readFile(file).catch(() => null);
    return data && { body: data, contentType: null };
  }
  const { get } = await sdk();
  const res = await get(pathname, { access: await storeAccess() });
  if (!res || res.statusCode !== 200) return null;
  return { stream: res.stream, contentType: res.blob.contentType };
}

async function readText(item) {
  if (!useBlob && !onVercel) return fs.readFile(path.join(LOCAL, item.pathname), "utf8");
  const { get } = await sdk();
  const res = await get(item.pathname, { access: await storeAccess(), useCache: false });
  if (!res || res.statusCode !== 200) throw new StorageError(`Couldn't read ${item.pathname}`);
  return new Response(res.stream).text();
}

async function remove(items) {
  if (!items.length) return;
  if (!useBlob && !onVercel) {
    await Promise.all(items.map((i) => fs.unlink(path.join(LOCAL, i.pathname)).catch(() => {})));
    return;
  }
  const { del } = await sdk();
  await del(items.map((i) => i.pathname));
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

/* ---------- health check for the admin ---------- */
export async function storageStatus() {
  if (!useBlob && !onVercel) return { ok: true, mode: "local" };
  try {
    const acc = await storeAccess();
    await listAll("content/");
    return { ok: true, mode: "vercel-blob", access: acc };
  } catch (err) {
    return { ok: false, mode: useBlob ? "vercel-blob" : "missing", error: describe(err) };
  }
}

export function describe(err) {
  if (err instanceof StorageError) return err.message;
  const m = String(err?.message || err);
  if (/no blob credentials/i.test(m)) return "Vercel Blob is connected but the site couldn't sign in to it. In Vercel → Settings → Security, make sure “Secure backend access with OIDC federation” is on, then redeploy. Or reconnect the store with “Add a read-write token env var” ticked.";
  if (/access denied|valid token/i.test(m)) return "Vercel Blob rejected the token. Reconnect the Blob store to this project (Storage tab) and redeploy.";
  if (/store.*(not.*found|does not exist)|BlobStoreNotFound/i.test(m)) return "The Blob store connected to this project no longer exists. Create or reconnect one in the Storage tab and redeploy.";
  if (/suspended/i.test(m)) return "The Blob store is suspended (usually the free-plan limit). Check Vercel → Storage.";
  return `Storage error: ${m}`;
}

export const storageMode = useBlob ? "vercel-blob" : onVercel ? "missing" : "local";
