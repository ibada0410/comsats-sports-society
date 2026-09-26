/* Small response helpers shared by the API routes. */

import { isAuthed } from "./auth.js";

export function send(res, status, data, headers = {}) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(typeof data === "string" ? data : JSON.stringify(data));
}

export function requireAuth(req, res) {
  if (isAuthed(req)) return true;
  send(res, 401, { error: "Your session has expired. Log in again." });
  return false;
}

export function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}
