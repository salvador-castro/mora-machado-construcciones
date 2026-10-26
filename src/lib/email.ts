import "server-only";
import { createElement } from "react";
import { render } from "@react-email/components";
import { Resend } from "resend";
import { LeadConfirmationEmail } from "@/emails/lead-confirmation";
import { LeadNotificationEmail, type LeadEmailData } from "@/emails/lead-notification";
import { TestEmail } from "@/emails/test-email";
import { db } from "@/lib/db";
import { phonesSchema } from "@/lib/content/schemas";
import { primaryWhatsApp, whatsappUrl } from "@/lib/whatsapp";

/** SENT: Resend accepted it · FAILED: error · LOGGED: dev without API key, printed only. */
export type EmailResult =
  { status: "SENT"; id: string } | { status: "FAILED"; error: string } | { status: "LOGGED" };

let client: Resend | undefined;

async function deliver(msg: {
  to: string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}): Promise<EmailResult> {
  let html: string, text: string;
  try {
    [html, text] = await Promise.all([render(msg.react), render(msg.react, { plainText: true })]);
  } catch (err) {
    console.error("[email] render failed", err);
    return { status: "FAILED", error: `Error al armar el email: ${String(err).slice(0, 200)}` };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email] RESEND_API_KEY vacía — no se envía.\nPara: ${msg.to.join(", ")}\n` +
          `Reply-To: ${msg.replyTo ?? "-"}\nAsunto: ${msg.subject}\n\n${text}\n`,
      );
      return { status: "LOGGED" };
    }
    console.error("[email] RESEND_API_KEY is not set");
    return { status: "FAILED", error: "RESEND_API_KEY no está configurada." };
  }
  const from = process.env.MAIL_FROM;
  if (!from) return { status: "FAILED", error: "MAIL_FROM no está configurado." };

  try {
    client ??= new Resend(apiKey);
    const { data, error } = await client.emails.send({
      from,
      to: msg.to,
      subject: msg.subject,
      html,
      text,
      replyTo: msg.replyTo,
    });
    if (error || !data) {
      const detail = error ? `${error.name}: ${error.message}` : "Respuesta vacía de Resend";
      console.error("[email] Resend error", detail);
      return { status: "FAILED", error: detail };
    }
    console.info(`[email] sent ${data.id} → ${msg.to.join(", ")}`);
    return { status: "SENT", id: data.id };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[email] send threw", err);
    return { status: "FAILED", error: detail };
  }
}

/** Settings → notificationEmails, or MAIL_TO_DEFAULT when that list is empty. */
export async function leadRecipients(): Promise<string[]> {
  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { notificationEmails: true },
  });
  const list = settings?.notificationEmails ?? [];
  const fallback = process.env.MAIL_TO_DEFAULT;
  return list.length ? list : fallback ? [fallback] : [];
}

async function brandName() {
  const s = await db.siteSettings.findUnique({ where: { id: 1 }, select: { brandName: true } });
  return s?.brandName ?? "";
}

/**
 * Emails a lead to the team and records the outcome on the Lead
 * (emailStatus SENT/FAILED + Resend id or error in emailInfo).
 * Never throws: the lead is already saved.
 */
export async function sendLeadNotification(
  lead: LeadEmailData & { id: string },
): Promise<EmailResult> {
  let result: EmailResult;
  let brand = "";
  try {
    const to = await leadRecipients();
    brand = await brandName();
    result = to.length
      ? await deliver({
          to,
          subject: `Nueva consulta web – ${lead.name} – ${lead.phone}`,
          replyTo: lead.email ?? undefined,
          react: createElement(LeadNotificationEmail, {
            lead,
            brandName: brand,
            whatsappUrl: whatsappUrl(
              lead.phone,
              `Hola ${lead.name.split(" ")[0]}, te escribo de ${brand} por la consulta que dejaste en la web.`,
            ),
          }),
        })
      : { status: "FAILED", error: "No hay destinatarios configurados." };
  } catch (err) {
    console.error("[email] sendLeadNotification failed", err);
    result = { status: "FAILED", error: err instanceof Error ? err.message : String(err) };
  }

  if (result.status !== "LOGGED") {
    await db.lead
      .update({
        where: { id: lead.id },
        data: {
          emailStatus: result.status,
          emailInfo: result.status === "SENT" ? result.id : result.error.slice(0, 500),
        },
      })
      .catch((err) => console.error("[email] could not record emailStatus", err));
  }
  if (process.env.LEAD_CONFIRMATION_EMAIL === "true" && lead.email) {
    await sendLeadConfirmation(lead, brand).catch((err) =>
      console.error("[email] confirmation failed", err),
    );
  }
  return result;
}

/** Optional acknowledgement to the person who wrote. */
async function sendLeadConfirmation(lead: LeadEmailData, brand: string) {
  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { phones: true, email: true },
  });
  const wa = primaryWhatsApp(phonesSchema.catch([]).parse(settings?.phones));
  await deliver({
    to: [lead.email!],
    subject: `Recibimos tu consulta – ${brand}`,
    replyTo: settings?.email ?? undefined,
    react: createElement(LeadConfirmationEmail, {
      name: lead.name,
      message: lead.message,
      brandName: brand,
      phone: wa?.number ?? null,
    }),
  });
}

/** Checks the email setup from Settings → "Enviar email de prueba". */
export async function sendTestEmail(to: string[], sentBy: string): Promise<EmailResult> {
  if (to.length === 0) return { status: "FAILED", error: "No hay destinatarios configurados." };
  return deliver({
    to,
    subject: "Email de prueba – sitio web",
    react: createElement(TestEmail, { brandName: await brandName(), sentBy }),
  });
}
