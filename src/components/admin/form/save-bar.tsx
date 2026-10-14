"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/admin/ui/button";

/** Sticky save/discard bar for admin forms. */
export function SaveBar({
  pending,
  dirty,
  onDiscard,
  label = "Guardar",
}: {
  pending: boolean;
  dirty: boolean;
  onDiscard: () => void;
  label?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
      {dirty && <p className="mr-auto text-xs text-muted-foreground">Hay cambios sin guardar.</p>}
      <Button type="button" variant="ghost" onClick={onDiscard} disabled={pending || !dirty}>
        Descartar
      </Button>
      <Button type="submit" disabled={pending || !dirty}>
        {pending && <Loader2 className="animate-spin" />}
        {label}
      </Button>
    </div>
  );
}
