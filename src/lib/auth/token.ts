import { jwtVerify, SignJWT } from "jose";

/** Edge/Node-safe token helpers (used by proxy.ts and the session module). */

export const SESSION_COOKIE = "mm_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = { sid: string; uid: string; role: "ADMIN" | "EDITOR" };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(s);
}

export async function signSessionToken(claims: SessionClaims, expiresAt: Date) {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setAudience("mm-admin")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), {
      audience: "mm-admin",
      algorithms: ["HS256"],
    });
    if (typeof payload.sid !== "string" || typeof payload.uid !== "string") return null;
    if (payload.role !== "ADMIN" && payload.role !== "EDITOR") return null;
    return { sid: payload.sid, uid: payload.uid, role: payload.role };
  } catch {
    return null;
  }
}
