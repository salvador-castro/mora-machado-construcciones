import "server-only";
import { createHash } from "node:crypto";
import { listEntityConfig, type ListEntity } from "@/lib/admin/list-entities";
import { db } from "@/lib/db";
import { getMediaItems } from "@/server/actions/media";

type FindMany = (args: { orderBy: { order: "asc" } }) => Promise<Record<string, unknown>[]>;

/** Rows + media previews for a ListManager; `version` remounts it after router.refresh(). */
export async function loadList(entity: ListEntity) {
  const config = listEntityConfig(entity);
  const rows = (await (db[entity] as unknown as { findMany: FindMany }).findMany({
    orderBy: { order: "asc" },
  })) as ({ id: string } & Record<string, unknown>)[];

  const mediaKeys = config.fields.filter((f) => f.type === "media").map((f) => f.name);
  const ids = rows
    .flatMap((r) => mediaKeys.map((k) => r[k]))
    .filter((v): v is string => typeof v === "string");
  const previews = Object.fromEntries(
    (await getMediaItems([...new Set(ids)])).map((m) => [m.id, m]),
  );

  const defaults: Record<string, unknown> = {};
  for (const f of config.fields) {
    defaults[f.name] =
      f.type === "media"
        ? null
        : f.type === "icon"
          ? "Layers"
          : f.type === "toggle"
            ? false
            : f.type === "select"
              ? f.required && f.options !== "projects"
                ? f.options[0]?.value
                : null
              : "";
  }

  const items = rows.map((r) => {
    const out: Record<string, unknown> = { ...r };
    // Inputs need "" instead of null.
    for (const f of config.fields)
      if ((f.type === "text" || f.type === "textarea") && out[f.name] === null) out[f.name] = "";
    return out as { id: string } & Record<string, unknown>;
  });
  const version = createHash("sha1").update(JSON.stringify(items)).digest("hex").slice(0, 12);

  return { items, previews, defaults, version };
}

export async function projectOptions() {
  const projects = await db.project.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });
  return projects.map((p) => ({ value: p.id, label: p.title }));
}
