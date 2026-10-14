import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken, verifySessionToken } from "./token";

export type Role = "ADMIN" | "EDITOR";
export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  sessionId: string;
};

export async function createSession(user: { id: string; role: Role }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const session = await db.session.create({ data: { userId: user.id, expiresAt, userAgent } });
  const token = await signSessionToken(
    { sid: session.id, uid: user.id, role: user.role },
    expiresAt,
  );

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;
  if (claims) await db.session.deleteMany({ where: { id: claims.sid } });
  jar.delete(SESSION_COOKIE);
}

/**
 * Current user for this request (deduped with React cache). Validates the JWT,
 * then the DB session (revocable) and that the user is still active.
 * Reads cookies → must run inside a Suspense boundary or a server action.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Explicit request-time boundary: token verification uses the current time.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const session = await db.session.findUnique({
    where: { id: claims.sid },
    include: { user: { select: { id: true, name: true, email: true, role: true, active: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  if (session.user.id !== claims.uid) return null;

  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  };
});

/** Data-access guard for admin pages and server actions. */
export async function requireUser(role?: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login?expired=1");
  if (role === "ADMIN" && user.role !== "ADMIN") redirect("/admin?denied=1");
  return user;
}
