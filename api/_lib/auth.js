/* Password login → signed token (no database needed).
   Set ADMIN_PASSWORD in Vercel → Project → Settings → Environment Variables. */

import crypto from "node:crypto";

const TOKEN_HOURS = 12;

const secret = () => process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "";
const sign = (data) => crypto.createHmac("sha256", secret()).update(data).digest("base64url");
const sameText = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

export function passwordConfigured() {
  return !!process.env.ADMIN_PASSWORD;
}

export function checkPassword(input) {
  return passwordConfigured() && sameText(input || "", process.env.ADMIN_PASSWORD);
}

export function createToken() {
  const exp = String(Date.now() + TOKEN_HOURS * 3600 * 1000);
  return `${exp}.${sign(exp)}`;
}

export function verifyToken(token) {
  if (!token || !passwordConfigured()) return false;
  const [exp, sig] = String(token).split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return sameText(sig, sign(exp));
}

export function isAuthed(req) {
  const header = req.headers.authorization || "";
  return verifyToken(header.replace(/^Bearer\s+/i, ""));
}
