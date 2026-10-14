"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import { sendSettingsTestEmail } from "@/server/actions/settings";

/** Sends a test email to the saved recipients (unsaved edits are not used). */
export function TestEmailButton({ dirty }: { dirty: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await sendSettingsTestEmail();
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <Send />}
        Enviar email de prueba
      </Button>
      <p className="text-xs text-muted-foreground">
        {dirty
          ? "Guardá los cambios primero: se envía a los emails guardados."
          : "Se envía a los emails guardados (o a la casilla por defecto si no hay ninguno)."}
      </p>
    </div>
  );
}
