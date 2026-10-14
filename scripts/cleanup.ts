/**
 * Daily housekeeping (cron, see deploy/crontab): removes expired sessions and
 * expired rate-limit windows. Leads and audit logs are kept.
 * Usage: `pnpm db:cleanup`
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db-client";

const db = createPrismaClient();
const now = new Date();
const [sessions, limits] = await Promise.all([
  db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
]);
console.log(
  `[cleanup] ${now.toISOString()} sesiones vencidas: ${sessions.count}, rate limits: ${limits.count}`,
);
await db.$disconnect();
