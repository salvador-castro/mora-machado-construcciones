import "server-only";
import { db } from "@/lib/db";
import { escapeHtml, sendMail } from "@/lib/mail";

type LeadForMail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  budgetRange: string | null;
  message: string;
  sourcePage: string;
};

/** Emails the new lead to SiteSettings.notificationEmails (best effort). */
export async function notifyNewLead(lead: LeadForMail) {
  const settings = await db.siteSettings.findUnique({
    where: { id: 1 },
    select: { notificationEmails: true, brandName: true },
  });
  const to = settings?.notificationEmails ?? [];
  if (to.length === 0) return;

  const adminUrl = `${process.env.SITE_URL ?? ""}/admin/consultas/${lead.id}`;
  const rows: [string, string | null][] = [
    ["Nombre", lead.name],
    ["Teléfono", lead.phone],
    ["Email", lead.email],
    ["Presupuesto", lead.budgetRange],
    ["Enviada desde", lead.sourcePage],
  ];
  const present = rows.filter((r): r is [string, string] => !!r[1]);

  const text = [
    `Nueva consulta desde el sitio de ${settings?.brandName ?? ""}`.trim(),
    "",
    ...present.map(([k, v]) => `${k}: ${v}`),
    "",
    lead.message,
    "",
    `Ver en el panel: ${adminUrl}`,
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p style="margin:0 0 16px">Nueva consulta desde el sitio.</p>
<table cellpadding="4" style="border-collapse:collapse;margin-bottom:16px">
${present.map(([k, v]) => `<tr><td style="color:#666;padding-right:16px">${escapeHtml(k)}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`).join("\n")}
</table>
<p style="white-space:pre-wrap;margin:0 0 24px;padding:12px 16px;background:#f4f2ee">${escapeHtml(lead.message)}</p>
<p><a href="${escapeHtml(adminUrl)}" style="color:#111">Ver la consulta en el panel</a></p>
</div>`;

  await sendMail({
    to,
    subject: `Nueva consulta: ${lead.name}`,
    text,
    html,
    replyTo: lead.email ?? undefined,
  });
}
