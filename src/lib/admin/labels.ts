import type { LeadStatus } from "@/generated/prisma/enums";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Nueva",
  CONTACTED: "Contactada",
  QUOTED: "Presupuestada",
  WON: "Ganada",
  LOST: "Perdida",
  SPAM: "Spam",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  NEW: "bg-accent text-accent-fg",
  CONTACTED: "bg-sky-100 text-sky-900",
  QUOTED: "bg-amber-100 text-amber-900",
  WON: "bg-emerald-100 text-emerald-900",
  LOST: "bg-muted text-muted-foreground",
  SPAM: "bg-muted text-muted-foreground line-through",
};

const rtf = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "hace 3 horas" — only for request-time (dynamic) admin renders. */
export function timeAgo(date: Date, now = new Date()) {
  const diff = (date.getTime() - now.getTime()) / 1000;
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "recién";
}
