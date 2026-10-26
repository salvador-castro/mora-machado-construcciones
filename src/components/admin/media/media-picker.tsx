"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import type { MediaListItem } from "@/lib/media/admin-types";
import { MediaGrid } from "./media-grid";
import { MediaUploader } from "./media-uploader";
import { useMediaList } from "./use-media-list";

/**
 * Dialog to choose one or many images from the library (or upload new ones).
 * `videos` also lists and accepts videos: only where they can play (project gallery).
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  multiple = false,
  videos = false,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple?: boolean;
  videos?: boolean;
  onSelect: (items: MediaListItem[]) => void;
}) {
  const list = useMediaList(undefined, { videos });
  const noun = videos
    ? multiple
      ? "fotos o videos"
      : "foto o video"
    : multiple
      ? "imágenes"
      : "imagen";
  const [selected, setSelected] = useState<Map<string, MediaListItem>>(new Map());
  const [tab, setTab] = useState("library");

  function toggle(item: MediaListItem) {
    if (!multiple) {
      onSelect([item]);
      onOpenChange(false);
      return;
    }
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.set(item.id, item);
      return next;
    });
  }

  function confirm() {
    onSelect([...selected.values()]);
    setSelected(new Map());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Elegir {noun}</DialogTitle>
          <DialogDescription>Elegí de la biblioteca o subí nuevas.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
          <TabsList>
            <TabsTrigger value="library">Biblioteca</TabsTrigger>
            <TabsTrigger value="upload">Subir</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="min-h-0 space-y-4 overflow-y-auto">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                value={list.query}
                onChange={(e) => list.setQuery(e.target.value)}
                placeholder="Buscar"
                className="pl-9"
                aria-label="Buscar imágenes"
              />
            </div>
            <MediaGrid
              items={list.items}
              selected={multiple ? new Set(selected.keys()) : undefined}
              onItemClick={toggle}
            />
            {list.hasMore && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={list.loadMore} disabled={list.pending}>
                  {list.pending && <Loader2 className="animate-spin" />}
                  Cargar más
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="upload">
            <MediaUploader
              compact
              videos={videos}
              onUploaded={(items) => {
                list.prepend(items);
                if (multiple) {
                  setSelected((prev) => {
                    const next = new Map(prev);
                    for (const i of items) next.set(i.id, i);
                    return next;
                  });
                  setTab("library");
                } else if (items[0]) {
                  onSelect([items[0]]);
                  onOpenChange(false);
                }
              }}
            />
          </TabsContent>
        </Tabs>
        {multiple && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={confirm} disabled={selected.size === 0}>
              Agregar {selected.size > 0 ? selected.size : ""}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Single-image form field: preview + choose/remove. Value is a media id. */
export function MediaField({
  value,
  preview,
  onChange,
  id,
  invalid,
}: {
  value: string | null | undefined;
  preview?: MediaListItem | null;
  onChange: (id: string | null, item: MediaListItem | null) => void;
  id?: string;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<MediaListItem | null>(preview ?? null);
  const shown = value ? current : null;

  return (
    <div className="flex items-start gap-3">
      <div
        className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted aria-invalid:border-destructive"
        aria-invalid={invalid || undefined}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
          <img src={shown.thumbUrl} alt={shown.alt} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="space-y-2">
        {shown && (
          <p className="line-clamp-2 max-w-xs text-xs text-muted-foreground">{shown.alt}</p>
        )}
        <div className="flex gap-2">
          <Button id={id} type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {value ? "Cambiar" : "Elegir imagen"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrent(null);
                onChange(null, null);
              }}
            >
              <X />
              Quitar
            </Button>
          )}
        </div>
      </div>
      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={([item]) => {
          setCurrent(item);
          onChange(item.id, item);
        }}
      />
    </div>
  );
}
