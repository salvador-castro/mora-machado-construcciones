/**
 * Daily housekeeping (cron, see deploy/crontab): removes expired sessions,
 * expired rate-limit windows and leads older than LEAD_RETENTION_DAYS (default
 * 730, the period stated in the privacy policy). Audit logs are kept.
 * Usage: `pnpm db:cleanup`
 */
import "dotenv/config";
import { createPrismaClient } from "@/lib/db-client";

const db = createPrismaClient();
const now = new Date();
const retentionDays = Number(process.env.LEAD_RETENTION_DAYS) || 730;
const leadCutoff = new Date(now.getTime() - retentionDays * 86_400_000);
const [sessions, limits, leads] = await Promise.all([
  db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
  db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }),
  db.lead.deleteMany({ where: { createdAt: { lt: leadCutoff } } }),
]);
console.log(
  `[cleanup] ${now.toISOString()} sesiones vencidas: ${sessions.count}, rate limits: ${limits.count}, ` +
    `consultas de más de ${retentionDays} días: ${leads.count}`,
);
await db.$disconnect();
