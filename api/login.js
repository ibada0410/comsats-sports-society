/* POST /api/login { password } → { token } */

import { checkPassword, createToken, passwordConfigured, isAuthed } from "./_lib/auth.js";
import { send, body } from "./_lib/http.js";
import { storageMode } from "./_lib/store.js";

export default async function handler(req, res) {
  // lets the admin check whether a saved token is still valid
  if (req.method === "GET") return send(res, 200, { ok: isAuthed(req), storage: storageMode });

  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  if (!passwordConfigured()) {
    return send(res, 500, { error: "ADMIN_PASSWORD isn't set. Add it in Vercel → Settings → Environment Variables, then redeploy." });
  }
  if (!checkPassword(body(req).password)) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return send(res, 401, { error: "Wrong password." });
  }
  return send(res, 200, { token: createToken(), storage: storageMode });
}
