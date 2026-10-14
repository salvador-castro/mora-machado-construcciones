import "server-only";
import { db } from "@/lib/db";

export async function blogCategoryOptions() {
  const categories = await db.blogCategory.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true },
  });
  return categories.map((c) => ({ value: c.id, label: c.name }));
}

/** Date → "yyyy-mm-dd" in Buenos Aires (for <input type="date">). */
export function toDayInput(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}
