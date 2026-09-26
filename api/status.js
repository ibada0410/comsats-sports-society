/* GET /api/status → is storage working? (admin only; shown as a banner in the admin when it isn't) */

import { storageStatus } from "./_lib/store.js";
import { passwordConfigured } from "./_lib/auth.js";
import { send, requireAuth } from "./_lib/http.js";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const storage = await storageStatus();
  return send(res, 200, { ...storage, password: passwordConfigured() }, { "Cache-Control": "no-store" });
}
