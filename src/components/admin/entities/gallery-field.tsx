"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ImageIcon, Images, Trash2 } from "lucide-react";
import { FormSection } from "@/components/admin/form/field";
import { MediaPickerDialog } from "@/components/admin/media/media-picker";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import type { MediaListItem } from "@/lib/media/admin-types";

const MAX = 60;

/** Project gallery: add from the library, drag to reorder, caption each image. */
export function GalleryField({
  name,
  initialPreviews,
}: {
  name: string;
  initialPreviews: Record<string, MediaListItem>;
}) {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const [previews, setPreviews] = useState(initialPreviews);
  const [pickerOpen, setPickerOpen] = useState(false);
  const items = fields as unknown as { id: string; mediaId: string }[];

  return (
    <FormSection
      title={`Galería (${fields.length})`}
      description="Arrastrá para ordenar. El epígrafe es opcional y se ve debajo de la foto."
    >
      {fields.length === 0 ? (
        <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          La obra todavía no tiene fotos en la galería.
        </p>
      ) : (
        <SortableList
          items={items}
          layout="grid"
          onReorder={(_, from, to) => move(from, to)}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          itemClassName="rounded-lg border bg-card"
          renderItem={(item, handle, i) => {
            const media = previews[item.mediaId];
            return (
              <div className="flex h-full flex-col">
                <div className="relative aspect-4/3 overflow-hidden rounded-t-lg bg-muted">
                  {media ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={media.thumbUrl} alt={media.alt} className="size-full object-cover" />
                  ) : (
                    <ImageIcon className="m-auto mt-10 size-6 text-muted-foreground" />
                  )}
                  <div className="absolute top-1 left-1 rounded bg-card/90">{handle}</div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute top-1 right-1 size-8"
                    aria-label={`Quitar foto ${i + 1}`}
                    onClick={() => remove(i)}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="p-2">
                  <Input
                    aria-label={`Epígrafe de la foto ${i + 1}`}
                    placeholder="Epígrafe"
                    maxLength={160}
                    className="h-8 text-xs"
                    {...register(`${name}.${i}.caption`)}
                  />
                </div>
              </div>
            );
          }}
        />
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={fields.length >= MAX}
        onClick={() => setPickerOpen(true)}
      >
        <Images /> Agregar fotos
      </Button>
      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        onSelect={(selected) => {
          const room = MAX - fields.length;
          const added = selected.slice(0, room);
          setPreviews((prev) => ({ ...prev, ...Object.fromEntries(added.map((m) => [m.id, m])) }));
          append(added.map((m) => ({ mediaId: m.id, caption: "" })));
        }}
      />
    </FormSection>
  );
}
