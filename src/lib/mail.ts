import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return (transporter = null);
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export type MailMessage = {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/**
 * Sends an email via SMTP. Without SMTP_HOST (local dev) it only logs.
 * Returns false on failure; callers decide whether that matters.
 */
export async function sendMail(msg: MailMessage): Promise<boolean> {
  if (msg.to.length === 0) return false;
  const t = getTransporter();
  if (!t) {
    console.info(
      `[mail] SMTP not configured — would send "${msg.subject}" to ${msg.to.join(", ")}`,
    );
    return false;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM, ...msg });
    return true;
  } catch (err) {
    console.error("[mail] send failed", err);
    return false;
  }
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
