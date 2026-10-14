import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limit backed by Postgres (no Redis needed at this scale).
 * Atomic upsert: resets the window when expired, otherwise increments.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await db.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" < now() THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" < now()
                       THEN now() + make_interval(secs => ${windowSeconds})
                       ELSE "RateLimit"."resetAt" END
    RETURNING "count", "resetAt"`;
  const { count, resetAt } = rows[0];
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export async function resetRateLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Hashes the client IP with a salt so raw IPs are never stored. */
export function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/** Client IP behind Nginx (X-Real-IP / X-Forwarded-For set by our proxy). */
export function clientIp(h: Headers) {
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
