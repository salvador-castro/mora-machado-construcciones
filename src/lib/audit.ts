import "server-only";
import { db } from "@/lib/db";

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
) {
  try {
    await db.auditLog.create({ data: { userId, action, entity, entityId: entityId ?? null } });
  } catch (err) {
    console.error("[audit] failed", err);
  }
}
