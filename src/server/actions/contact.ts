"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { notifyNewLead } from "@/lib/leads/notify";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { leadSchema } from "@/lib/validation/lead";

export type ContactResult =
  { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Generous in dev so e2e reruns don't trip it.
const LIMIT = process.env.NODE_ENV === "production" ? 5 : 100;
const WINDOW_SECONDS = 15 * 60;
const URL_RE = /https?:\/\/|www\./gi;

/** Public contact form: stores the lead and emails the team (after the response). */
export async function submitLead(data: unknown, turnstileToken?: string): Promise<ContactResult> {
  // Honeypot filled → pretend success, store nothing.
  if (typeof data === "object" && data && "website" in data && data.website) return { ok: true };

  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ok: false, error: "Revisá los campos marcados.", fieldErrors };
  }
  const lead = parsed.data;

  const h = await headers();
  const ip = clientIp(h);
  const ipHash = hashIp(ip);
  const limit = await rateLimit(`lead:${ipHash}`, LIMIT, WINDOW_SECONDS);
  if (!limit.ok) {
    return {
      ok: false,
      error:
        "Recibimos varias consultas seguidas desde tu conexión. Probá en unos minutos o escribinos por WhatsApp.",
    };
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return {
      ok: false,
      error: "No pudimos verificar el envío. Recargá la página y probá de nuevo.",
    };
  }

  const links = lead.message.match(URL_RE)?.length ?? 0;
  const sourcePage =
    lead.sourcePage?.startsWith("/") && !lead.sourcePage.startsWith("//") ? lead.sourcePage : "/";

  const saved = await db.lead.create({
    data: {
      name: lead.name,
      phone: lead.phone,
      email: lead.email || null,
      budgetRange: lead.budgetRange || null,
      message: lead.message,
      sourcePage,
      consent: lead.consent,
      ipHash,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
      // Link-stuffed messages go straight to spam (still reviewable in the admin).
      status: links > 3 ? "SPAM" : "NEW",
    },
  });

  if (saved.status === "NEW") after(() => notifyNewLead(saved));
  return { ok: true };
}
