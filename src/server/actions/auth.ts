"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { clientIp, hashIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string } | undefined;

const loginSchema = z.object({
  email: z.email().trim().toLowerCase().max(200),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

const GENERIC_ERROR = "Email o contraseña incorrectos.";
// Real argon2id hash of a random value: verifying against it when the email
// doesn't exist keeps response time similar (no user enumeration by timing).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword(randomUUID()));

/** Only allow redirects back into the admin. */
function safeNext(next: string | undefined) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  const email = String(formData.get("email") ?? "").slice(0, 200);
  if (!parsed.success) return { error: GENERIC_ERROR, email };

  const ip = hashIp(clientIp(await headers()));
  const perAccount = await rateLimit(`login:${ip}:${parsed.data.email}`, 5, 15 * 60);
  const perIp = await rateLimit(`login-ip:${ip}`, 20, 15 * 60);
  if (!perAccount.ok || !perIp.ok) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a probar.", email };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(
    user?.passwordHash ?? (await getDummyHash()),
    parsed.data.password,
  );
  if (!user || !valid || !user.active) {
    await audit(user?.id ?? null, "login_failed", "User", user?.id);
    return { error: GENERIC_ERROR, email };
  }

  await resetRateLimit(`login:${ip}:${parsed.data.email}`);
  await createSession({ id: user.id, role: user.role });
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "login", "User", user.id);

  redirect(safeNext(parsed.data.next));
}

export async function logout() {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit(user.id, "logout", "User", user.id);
  redirect("/admin/login");
}
