import "server-only";
import { db } from "@/lib/db";

/** Select options for the project editor. */
export async function projectFormOptions() {
  const [categories, services] = await Promise.all([
    db.projectCategory.findMany({ orderBy: { order: "asc" }, select: { id: true, name: true } }),
    db.service.findMany({ orderBy: { order: "asc" }, select: { id: true, title: true } }),
  ]);
  return {
    categories: categories.map((c) => ({ value: c.id, label: c.name })),
    services: services.map((s) => ({ value: s.id, label: s.title })),
  };
}
