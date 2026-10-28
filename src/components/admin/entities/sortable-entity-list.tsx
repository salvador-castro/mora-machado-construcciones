"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/admin/ui/popover";
import { Switch } from "@/components/admin/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/admin/ui/tooltip";
import { cn } from "@/lib/cn";
import { setProjectFlag } from "@/server/actions/projects";
import { moveTo, reorder } from "@/server/actions/reorder";
import { setServicePublished } from "@/server/actions/services";

export type EntityRow = {
  id: string;
  title: string;
  subtitle?: string;
  thumbUrl?: string | null;
  published: boolean;
  featured?: boolean;
  /** 1-based position in the whole list (needed when the list is filtered). */
  position?: number;
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
  total,
}: {
  entity: "service" | "project";
  rows: EntityRow[];
  editBase: string;
  empty: string;
  sortable?: boolean;
  offset?: number;
  /** Size of the whole list, for "Mover a…" (defaults to the rows shown). */
  total?: number;
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

  // Sortable lists show their live order; filtered ones the position the server sent.
  const positionOf = (row: EntityRow, index: number) =>
    sortable ? (offset ?? 0) + index + 1 : (row.position ?? index + 1);

  const renderRow = (row: EntityRow, handle: React.ReactNode, index: number) => (
    <div className="flex items-center gap-3 px-2 py-2.5 sm:px-3">
      {handle}
      <span className="w-7 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
        #{positionOf(row, index)}
      </span>
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
      <MoveControl
        entity={entity}
        row={row}
        position={positionOf(row, index)}
        total={total ?? rows.length}
      />
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
        {rows.map((row, i) => (
          <li key={row.id} className="bg-card">
            {renderRow(row, null, i)}
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
      renderItem={(row, handle, index) => renderRow(row, handle, index)}
    />
  );
}

/** "Mover a…": first, last or a given position (dragging doesn't scale to long lists). */
function MoveControl({
  entity,
  row,
  position,
  total,
}: {
  entity: "service" | "project";
  row: EntityRow;
  position: number;
  total: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [pending, startTransition] = useTransition();

  function move(to: number) {
    startTransition(async () => {
      const res = await moveTo(entity, row.id, to);
      if (res.ok) {
        toast.success(res.message);
        setOpen(false);
        setTarget("");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const to = Number(target);
    if (Number.isInteger(to) && to >= 1) move(Math.min(to, total));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Mover «${row.title}»`}
              className="inline-flex size-8 items-center justify-center rounded hover:bg-muted"
            >
              <ArrowUpDown className="size-4" />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Mover a otra posición</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64 space-y-3">
        <p className="text-sm">
          <span className="font-medium">{row.title}</span>
          <span className="block text-xs text-muted-foreground">
            Posición {position} de {total}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || position === 1}
            onClick={() => move(1)}
          >
            Al principio
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || position === total}
            onClick={() => move(total)}
          >
            Al final
          </Button>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={`1 a ${total}`}
            aria-label="Nueva posición"
            className="h-8"
          />
          <Button type="submit" size="sm" disabled={pending || !target}>
            Mover
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
