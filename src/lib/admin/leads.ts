import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { LeadStatus } from "@/generated/prisma/enums";

export const LEAD_PAGE_SIZE = 25;

/** "Todas" hides spam; spam has its own tab. */
export type LeadFilter = { status: LeadStatus | "ALL"; q: string };

export function parseLeadFilter(sp: Record<string, string | string[] | undefined>): LeadFilter {
  const raw = typeof sp.estado === "string" ? sp.estado : "";
  const status = (Object.values(LeadStatus) as string[]).includes(raw)
    ? (raw as LeadStatus)
    : "ALL";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  return { status, q };
}

export function leadWhere({ status, q }: LeadFilter): Prisma.LeadWhereInput {
  return {
    status: status === "ALL" ? { not: "SPAM" } : status,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
