"use server";

import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import {
  accountSchema,
  changePasswordSchema,
  passwordResetSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/admin/schemas";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { fail, fromZodError, isUniqueViolation, ok, type ActionResult } from "../action-utils";

const EMAIL_TAKEN = fail("Ya hay un usuario con ese email.", { email: "Email en uso" });

export async function createUser(data: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireUser("ADMIN");
  const parsed = userCreateSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const { password, ...values } = parsed.data;

  try {
    const user = await db.user.create({
      data: { ...values, passwordHash: await hashPassword(password) },
    });
    await audit(admin.id, "create", "User", user.id);
    return ok({ id: user.id }, "Usuario creado.");
  } catch (err) {
    if (isUniqueViolation(err)) return EMAIL_TAKEN;
    throw err;
  }
}

export async function updateUser(id: string, data: unknown): Promise<ActionResult> {
  const admin = await requireUser("ADMIN");
  const parsed = userUpdateSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  const values = parsed.data;

  const current = await db.user.findUnique({ where: { id } });
  if (!current) return fail("El usuario no existe.");
  if (id === admin.id && (values.role !== "ADMIN" || !values.active)) {
    return fail("No podés quitarte el rol de administrador ni desactivar tu propia cuenta.");
  }
  const losesAdmin =
    current.role === "ADMIN" && current.active && (values.role !== "ADMIN" || !values.active);
  if (losesAdmin) {
    const admins = await db.user.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) return fail("Tiene que quedar al menos un administrador activo.");
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id }, data: values });
      // Role/active changes take effect right away: force a new login.
      if (values.role !== current.role || !values.active) {
        await tx.session.deleteMany({ where: { userId: id } });
      }
    });
  } catch (err) {
    if (isUniqueViolation(err)) return EMAIL_TAKEN;
    throw err;
  }
  await audit(admin.id, "update", "User", id);
  return ok(undefined, "Usuario guardado.");
}

export async function resetUserPassword(id: string, data: unknown): Promise<ActionResult> {
  const admin = await requireUser("ADMIN");
  const parsed = passwordResetSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);

  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: id, id: { not: admin.sessionId } } }),
  ]);
  await audit(admin.id, "reset_password", "User", id);
  return ok(undefined, "Contraseña cambiada. Se cerraron sus sesiones abiertas.");
}

/** Posts and audit entries keep existing without author (SetNull). */
export async function deleteUser(id: string): Promise<ActionResult> {
  const admin = await requireUser("ADMIN");
  if (id === admin.id) return fail("No podés eliminar tu propia cuenta.");
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return fail("El usuario no existe.");
  if (target.role === "ADMIN" && target.active) {
    const admins = await db.user.count({ where: { role: "ADMIN", active: true } });
    if (admins <= 1) return fail("Tiene que quedar al menos un administrador activo.");
  }
  await db.user.delete({ where: { id } });
  await audit(admin.id, "delete", "User", id);
  return ok(undefined, "Usuario eliminado.");
}

// ─── Own account ───────────────────────────────────────────────

export async function updateAccount(data: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = accountSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);
  try {
    await db.user.update({ where: { id: user.id }, data: parsed.data });
  } catch (err) {
    if (isUniqueViolation(err)) return EMAIL_TAKEN;
    throw err;
  }
  await audit(user.id, "update_account", "User", user.id);
  return ok(undefined, "Datos guardados.");
}

export async function changePassword(data: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);

  // Generous in dev so e2e reruns don't trip it.
  const max = process.env.NODE_ENV === "production" ? 5 : 100;
  const limit = await rateLimit(`password-change:${user.id}`, max, 15 * 60);
  if (!limit.ok) return fail("Demasiados intentos. Esperá unos minutos y volvé a probar.");

  const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(row.passwordHash, parsed.data.current))) {
    return fail("La contraseña actual no es correcta.", { current: "Contraseña incorrecta" });
  }
  const passwordHash = await hashPassword(parsed.data.password);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    // Keep this session; sign out everywhere else.
    db.session.deleteMany({ where: { userId: user.id, id: { not: user.sessionId } } }),
  ]);
  await audit(user.id, "change_password", "User", user.id);
  return ok(undefined, "Contraseña cambiada. Se cerraron tus otras sesiones.");
}
