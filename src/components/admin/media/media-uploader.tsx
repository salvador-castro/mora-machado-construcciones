"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import type { MediaListItem } from "@/lib/media/admin-types";
import { uploadMedia } from "@/server/actions/media";
import { cn } from "@/lib/cn";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type QueueItem = {
  key: string;
  file: File;
  preview: string;
  alt: string;
  status: "idle" | "uploading" | "error";
  error?: string;
};

/** Suggests an alt from the filename; the user must review it before uploading. */
function altFromName(name: string) {
  const base = name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return /whatsapp|^img|^dsc|^\d/i.test(base) ? "" : base;
}

export function MediaUploader({
  onUploaded,
  compact = false,
}: {
  onUploaded: (items: MediaListItem[]) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  function addFiles(files: FileList | File[]) {
    const next: QueueItem[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPT.includes(file.type)) {
        toast.error(`${file.name}: formato no permitido (JPG, PNG, WebP o AVIF).`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: supera los 10 MB.`);
        continue;
      }
      next.push({
        key: `${file.name}-${file.size}-${crypto.randomUUID()}`,
        file,
        preview: URL.createObjectURL(file),
        alt: altFromName(file.name),
        status: "idle",
      });
    }
    setQueue((q) => [...q, ...next]);
  }

  function remove(key: string) {
    setQueue((q) => {
      const item = q.find((i) => i.key === key);
      if (item) URL.revokeObjectURL(item.preview);
      return q.filter((i) => i.key !== key);
    });
  }

  const missingAlt = queue.some((i) => i.alt.trim().length < 3);

  async function uploadAll() {
    setBusy(true);
    const uploaded: MediaListItem[] = [];
    for (const item of queue) {
      setQueue((q) => q.map((i) => (i.key === item.key ? { ...i, status: "uploading" } : i)));
      const fd = new FormData();
      fd.set("file", item.file);
      fd.set("alt", item.alt);
      const res = await uploadMedia(fd);
      if (res.ok && res.data) {
        uploaded.push(res.data);
        URL.revokeObjectURL(item.preview);
        setQueue((q) => q.filter((i) => i.key !== item.key));
      } else {
        const error = res.ok ? "Error" : res.error;
        setQueue((q) => q.map((i) => (i.key === item.key ? { ...i, status: "error", error } : i)));
      }
    }
    setBusy(false);
    if (uploaded.length) {
      toast.success(
        uploaded.length === 1 ? "Imagen subida." : `${uploaded.length} imágenes subidas.`,
      );
      onUploaded(uploaded);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 text-center transition-colors",
          compact ? "py-6" : "py-10",
          dragging ? "border-foreground bg-muted" : "border-input",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium">Arrastrá imágenes acá</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP o AVIF · hasta 10 MB cada una
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Elegir archivos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Describí cada imagen (texto alternativo). Es obligatorio para accesibilidad y SEO.
          </p>
          <ul className="space-y-2">
            {queue.map((item) => (
              <li key={item.key} className="flex items-start gap-3 rounded-md border bg-card p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                <img src={item.preview} alt="" className="size-16 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-xs text-muted-foreground">{item.file.name}</p>
                  <Input
                    value={item.alt}
                    placeholder="Ej.: Solado exterior junto a la piscina"
                    aria-label={`Texto alternativo para ${item.file.name}`}
                    aria-invalid={item.alt.trim().length < 3 || undefined}
                    disabled={item.status === "uploading"}
                    onChange={(e) =>
                      setQueue((q) =>
                        q.map((i) => (i.key === item.key ? { ...i, alt: e.target.value } : i)),
                      )
                    }
                  />
                  {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                </div>
                {item.status === "uploading" ? (
                  <Loader2 className="mt-2 size-4 animate-spin" aria-label="Subiendo" />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(item.key)}
                    aria-label="Quitar de la lista"
                    disabled={busy}
                  >
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button type="button" onClick={uploadAll} disabled={busy || missingAlt}>
              {busy && <Loader2 className="animate-spin" />}
              Subir {queue.length === 1 ? "imagen" : `${queue.length} imágenes`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
