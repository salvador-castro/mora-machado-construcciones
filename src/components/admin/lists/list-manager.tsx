"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Images, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { SortableList } from "@/components/admin/sortable-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/admin/ui/alert-dialog";
import { Button } from "@/components/admin/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/admin/ui/dialog";
import { Switch } from "@/components/admin/ui/switch";
import { listEntityConfig, type ListEntity } from "@/lib/admin/list-entities";
import type { MediaListItem } from "@/lib/media/admin-types";
import { cn } from "@/lib/cn";
import { addGalleryImages, deleteListItem, setListItemPublished } from "@/server/actions/lists";
import { reorder } from "@/server/actions/reorder";
import { ListItemForm, type SelectOptions } from "./list-item-form";

export type ListRow = { id: string; published?: boolean } & Record<string, unknown>;

/** Sortable, dialog-edited list for an entity in LIST_ENTITIES. */
export function ListManager({
  entity,
  items: initialItems,
  mediaPreviews,
  options = {},
  defaults,
}: {
  entity: ListEntity;
  items: ListRow[];
  mediaPreviews: Record<string, MediaListItem>;
  options?: SelectOptions;
  defaults: Record<string, unknown>;
}) {
  const config = listEntityConfig(entity);
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editing, setEditing] = useState<ListRow | "new" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  function onReorder(next: ListRow[]) {
    const previous = items;
    setItems(next);
    startTransition(async () => {
      const res = await reorder(
        entity,
        next.map((i) => i.id),
      );
      if (!res.ok) {
        setItems(previous);
        toast.error(res.error);
      }
    });
  }

  function togglePublished(row: ListRow, published: boolean) {
    setItems((list) => list.map((i) => (i.id === row.id ? { ...i, published } : i)));
    startTransition(async () => {
      const res = await setListItemPublished(entity, row.id, published);
      if (res.ok) toast.success(res.message);
      else {
        toast.error(res.error);
        refresh();
      }
    });
  }

  function remove(row: ListRow) {
    startTransition(async () => {
      const res = await deleteListItem(entity, row.id);
      if (res.ok) {
        setItems((list) => list.filter((i) => i.id !== row.id));
        toast.success(res.message);
      } else toast.error(res.error);
    });
  }

  const grid = config.layout === "grid";
  const editingRow = editing === "new" ? null : editing;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {entity === "galleryImage" ? (
          <Button onClick={() => setBulkOpen(true)}>
            <Images /> Agregar imágenes
          </Button>
        ) : (
          <Button onClick={() => setEditing("new")}>
            <Plus /> Agregar {config.label.toLowerCase()}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {config.empty}
        </p>
      ) : (
        <SortableList
          items={items}
          onReorder={onReorder}
          layout={grid ? "grid" : "list"}
          className={cn(
            grid
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              : "divide-y overflow-hidden rounded-lg border bg-card",
          )}
          itemClassName={grid ? "rounded-lg border bg-card" : "bg-card"}
          renderItem={(row, handle) => {
            const thumbId = config.thumb ? (row[config.thumb] as string | null) : null;
            const thumb = thumbId ? mediaPreviews[thumbId] : null;
            const title = String(row[config.title] ?? "") || (grid ? "" : "Sin título");
            const subtitle = config.subtitle ? String(row[config.subtitle] ?? "") : "";
            const actions = (
              <div className="flex items-center gap-1">
                {config.hasPublished && (
                  <Switch
                    checked={row.published !== false}
                    onCheckedChange={(v) => togglePublished(row, v)}
                    aria-label={row.published !== false ? "Ocultar" : "Mostrar"}
                    disabled={pending}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(row)}
                  aria-label="Editar"
                >
                  <Pencil />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Eliminar" disabled={pending}>
                      <Trash2 />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar {config.label.toLowerCase()}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {title ? `«${title}» ` : ""}se elimina del sitio. No se puede deshacer.
                        {config.hasPublished && " Si solo querés ocultarlo, usá el interruptor."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove(row)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            );

            if (grid) {
              return (
                <div
                  className={cn("flex h-full flex-col", row.published === false && "opacity-60")}
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-t-lg bg-muted">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                      <img
                        src={thumb.thumbUrl}
                        alt={thumb.alt}
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="m-auto mt-10 size-6 text-muted-foreground" />
                    )}
                    <div className="absolute top-1 left-1 rounded bg-card/90">{handle}</div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {title || thumb?.alt}
                    </p>
                    <div className="mt-auto flex justify-end">{actions}</div>
                  </div>
                </div>
              );
            }

            return (
              <div
                className={cn(
                  "flex items-center gap-3 px-2 py-2.5 sm:px-3",
                  row.published === false && "opacity-60",
                )}
              >
                {handle}
                {config.thumb &&
                  (thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img
                      src={thumb.thumbUrl}
                      alt=""
                      className="size-10 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="size-10 shrink-0 rounded bg-muted" />
                  ))}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {title}
                    {row.featured === true && (
                      <Star className="size-3.5 fill-current" aria-label="Destacado" />
                    )}
                  </p>
                  {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {actions}
              </div>
            );
          }}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRow
                ? `Editar ${config.label.toLowerCase()}`
                : `Agregar ${config.label.toLowerCase()}`}
            </DialogTitle>
          </DialogHeader>
          {editing !== null && (
            <ListItemForm
              entity={entity}
              id={editingRow?.id ?? null}
              defaults={editingRow ?? defaults}
              mediaPreviews={mediaPreviews}
              options={options}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {entity === "galleryImage" && (
        <MediaPickerDialog
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          multiple
          onSelect={(selected) =>
            startTransition(async () => {
              if (selected.length === 0) return;
              const res = await addGalleryImages(selected.map((s) => s.id));
              if (res.ok) {
                toast.success(res.message);
                refresh();
              } else toast.error(res.error);
            })
          }
        />
      )}
    </div>
  );
}
