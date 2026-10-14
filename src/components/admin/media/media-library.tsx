"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/admin/ui/dialog";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import type { MediaListItem } from "@/lib/media/admin-types";
import type { MediaUsage } from "@/lib/media/usage";
import { deleteMedia, mediaUsage, updateMediaAlt } from "@/server/actions/media";
import { MediaGrid } from "./media-grid";
import { MediaUploader } from "./media-uploader";
import { useMediaList } from "./use-media-list";

function formatSize(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export function MediaLibrary({
  initial,
}: {
  initial: { items: MediaListItem[]; nextCursor?: string };
}) {
  const list = useMediaList(initial);
  const [active, setActive] = useState<MediaListItem | null>(null);

  return (
    <div className="space-y-6">
      <MediaUploader onUploaded={list.prepend} />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={list.query}
          onChange={(e) => list.setQuery(e.target.value)}
          placeholder="Buscar por descripción o archivo"
          className="pl-9"
          aria-label="Buscar imágenes"
        />
      </div>

      <MediaGrid items={list.items} onItemClick={setActive} />

      {list.hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={list.loadMore} disabled={list.pending}>
            {list.pending && <Loader2 className="animate-spin" />}
            Cargar más
          </Button>
        </div>
      )}

      {active && (
        <MediaDetailDialog
          key={active.id}
          item={active}
          onClose={() => setActive(null)}
          onUpdated={(item) => {
            list.setItems((items) => items.map((i) => (i.id === item.id ? item : i)));
            setActive(item);
          }}
          onDeleted={(id) => {
            list.setItems((items) => items.filter((i) => i.id !== id));
            setActive(null);
          }}
        />
      )}
    </div>
  );
}

function MediaDetailDialog({
  item,
  onClose,
  onUpdated,
  onDeleted,
}: {
  item: MediaListItem;
  onClose: () => void;
  onUpdated: (item: MediaListItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    mediaUsage(item.id).then((u) => !cancelled && setUsage(u));
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  const save = () =>
    startTransition(async () => {
      const res = await updateMediaAlt(item.id, alt);
      if (res.ok) {
        toast.success(res.message);
        onUpdated({ ...item, alt: alt.trim() });
      } else toast.error(res.error);
    });

  const remove = () =>
    startTransition(async () => {
      const res = await deleteMedia(item.id);
      if (res.ok) {
        toast.success(res.message);
        onDeleted(item.id);
      } else toast.error(res.error);
    });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de imagen</DialogTitle>
          <DialogDescription className="truncate">
            {item.originalName} · {item.width}×{item.height} px · {formatSize(item.size)}
          </DialogDescription>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
        <img
          src={item.largeUrl}
          alt={item.alt}
          className="max-h-[50dvh] w-full rounded-md bg-muted object-contain"
        />
        <div className="space-y-2">
          <Label htmlFor="media-alt">Texto alternativo</Label>
          <div className="flex gap-2">
            <Input id="media-alt" value={alt} onChange={(e) => setAlt(e.target.value)} />
            <Button onClick={save} disabled={pending || alt.trim() === item.alt}>
              Guardar
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Dónde se usa</p>
          {usage === null ? (
            <p className="text-sm text-muted-foreground">Buscando…</p>
          ) : usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se usa en ningún lugar.</p>
          ) : (
            <ul className="list-inside list-disc text-sm">
              {usage.map((u, i) => (
                <li key={i}>
                  <Link
                    href={u.href}
                    className="underline-offset-2 hover:underline"
                    onClick={onClose}
                  >
                    {u.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-between gap-2 border-t pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={pending || !usage || usage.length > 0}>
                <Trash2 />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta imagen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se borran el archivo y todas sus versiones. No se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {usage && usage.length > 0 && (
            <p className="self-center text-xs text-muted-foreground">
              Para eliminarla, primero quitala de donde se usa.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
