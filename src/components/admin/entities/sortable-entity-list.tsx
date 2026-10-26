"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { SortableList } from "@/components/admin/sortable-list";
import { Switch } from "@/components/admin/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/admin/ui/tooltip";
import { cn } from "@/lib/cn";
import { setProjectFlag } from "@/server/actions/projects";
import { reorder } from "@/server/actions/reorder";
import { setServicePublished } from "@/server/actions/services";

export type EntityRow = {
  id: string;
  title: string;
  subtitle?: string;
  thumbUrl?: string | null;
  published: boolean;
  featured?: boolean;
};

/**
 * Drag & drop list of services or projects; rows link to their full-page editor.
 * Paginated lists pass `offset` (position of the first row in the whole list);
 * filtered ones pass `sortable={false}`, since their order isn't the real one.
 */
export function SortableEntityList({
  entity,
  rows: initialRows,
  editBase,
  empty,
  sortable = true,
  offset,
}: {
  entity: "service" | "project";
  rows: EntityRow[];
  editBase: string;
  empty: string;
  sortable?: boolean;
  offset?: number;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();

  function onReorder(next: EntityRow[]) {
    const previous = rows;
    setRows(next);
    startTransition(async () => {
      const res = await reorder(
        entity,
        next.map((r) => r.id),
        offset,
      );
      if (!res.ok) {
        setRows(previous);
        toast.error(res.error);
      }
    });
  }

  function setFlag(row: EntityRow, flag: "published" | "featured", value: boolean) {
    setRows((list) => list.map((r) => (r.id === row.id ? { ...r, [flag]: value } : r)));
    startTransition(async () => {
      const res =
        entity === "service"
          ? await setServicePublished(row.id, value)
          : await setProjectFlag(row.id, flag, value);
      if (res.ok) toast.success(res.message);
      else {
        toast.error(res.error);
        router.refresh();
      }
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }

  const renderRow = (row: EntityRow, handle: React.ReactNode) => (
    <div className="flex items-center gap-3 px-2 py-2.5 sm:px-3">
      {handle}
      {row.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
        <img
          src={row.thumbUrl}
          alt=""
          className={cn("size-10 shrink-0 rounded object-cover", !row.published && "opacity-50")}
        />
      ) : (
        <span className="size-10 shrink-0 rounded bg-muted" />
      )}
      <Link
        href={`${editBase}/${row.id}`}
        className="group flex min-w-0 flex-1 items-center gap-2 rounded focus-visible:outline-2"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:underline">{row.title}</span>
          {row.subtitle && (
            <span className="block truncate text-sm text-muted-foreground">{row.subtitle}</span>
          )}
        </span>
        {!row.published && (
          <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
            {entity === "project" ? "Oculta" : "Oculto"}
          </span>
        )}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
      {entity === "project" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled={pending}
              aria-pressed={!!row.featured}
              aria-label={row.featured ? "Quitar de destacadas" : "Destacar en inicio"}
              onClick={() => setFlag(row, "featured", !row.featured)}
              className="inline-flex size-8 items-center justify-center rounded hover:bg-muted"
            >
              <Star className={cn("size-4", row.featured && "fill-current")} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {row.featured ? "Destacada en inicio" : "Destacar en inicio"}
          </TooltipContent>
        </Tooltip>
      )}
      <Switch
        checked={row.published}
        disabled={pending}
        onCheckedChange={(v) => setFlag(row, "published", v)}
        aria-label={row.published ? `Ocultar «${row.title}»` : `Publicar «${row.title}»`}
      />
    </div>
  );

  if (!sortable) {
    return (
      <ul className="divide-y overflow-hidden rounded-lg border bg-card">
        {rows.map((row) => (
          <li key={row.id} className="bg-card">
            {renderRow(row, null)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <SortableList
      items={rows}
      onReorder={onReorder}
      className="divide-y overflow-hidden rounded-lg border bg-card"
      itemClassName="bg-card"
      renderItem={(row, handle) => renderRow(row, handle)}
    />
  );
}
