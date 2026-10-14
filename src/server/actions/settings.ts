"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/content/schemas";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import { leadRecipients, sendTestEmail } from "@/lib/email";
import { fail, fromZodError, invalidate, ok, type ActionResult } from "../action-utils";

export async function saveSettings(data: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) return fromZodError(parsed.error);

  const s = parsed.data;
  // Exactly one primary WhatsApp number when any phone is WhatsApp-enabled.
  const phones = s.phones.map((p) => ({ ...p, primary: p.primary && p.whatsapp }));
  if (!phones.some((p) => p.primary)) {
    const firstWa = phones.find((p) => p.whatsapp);
    if (firstWa) firstWa.primary = true;
  }

  await db.siteSettings.update({
    where: { id: 1 },
    data: { ...s, accentColor: s.accentColor.toUpperCase(), phones, updatedById: user.id },
  });
  await audit(user.id, "update", "SiteSettings", "1");
  invalidate(TAGS.settings);
  return ok(undefined, "Configuración guardada.");
}

/** Sends a test email to the saved lead recipients (or MAIL_TO_DEFAULT). */
export async function sendSettingsTestEmail(): Promise<ActionResult> {
  const user = await requireUser();
  const to = await leadRecipients();
  const res = await sendTestEmail(to, user.name);
  await audit(user.id, `test_email:${res.status}`, "SiteSettings", "1");
  if (res.status === "SENT") return ok(undefined, `Email de prueba enviado a ${to.join(", ")}.`);
  if (res.status === "LOGGED")
    return ok(undefined, "Sin RESEND_API_KEY: el email se mostró en la consola del servidor.");
  return fail(`No se pudo enviar: ${res.error}`);
}
