"use server";

import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { settingsSchema } from "@/lib/content/schemas";
import { TAGS } from "@/lib/content/tags";
import { db } from "@/lib/db";
import { fromZodError, invalidate, ok, type ActionResult } from "../action-utils";

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
