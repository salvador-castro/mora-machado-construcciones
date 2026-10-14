"use server";

import { z } from "zod";
import { LeadStatus } from "@/generated/prisma/enums";
import { audit } from "@/lib/audit";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sendLeadNotification } from "@/lib/email";
import { fail, ok, type ActionResult } from "../action-utils";

const statusSchema = z.enum(LeadStatus);
const notesSchema = z.string().max(5000);

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail("Estado inválido.");
  await db.lead.update({ where: { id }, data: { status: parsed.data } });
  await audit(user.id, `status:${parsed.data}`, "Lead", id);
  return ok(undefined, "Estado actualizado.");
}

export async function saveLeadNotes(id: string, notes: string): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = notesSchema.safeParse(notes);
  if (!parsed.success) return fail("Las notas son demasiado largas.");
  await db.lead.update({ where: { id }, data: { notes: parsed.data.trim() || null } });
  await audit(user.id, "notes", "Lead", id);
  return ok(undefined, "Notas guardadas.");
}

export async function deleteLead(id: string): Promise<ActionResult> {
  const user = await requireUser();
  await db.lead.delete({ where: { id } });
  await audit(user.id, "delete", "Lead", id);
  return ok(undefined, "Consulta eliminada.");
}

/** Re-sends the notification email of a lead whose first attempt failed. */
export async function retryLeadEmail(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return fail("La consulta no existe.");
  const res = await sendLeadNotification(lead);
  await audit(user.id, `email_retry:${res.status}`, "Lead", id);
  if (res.status === "SENT") return ok(undefined, "Email enviado.");
  if (res.status === "LOGGED")
    return ok(undefined, "Sin RESEND_API_KEY: el email se mostró en la consola del servidor.");
  return fail(`No se pudo enviar: ${res.error}`);
}
