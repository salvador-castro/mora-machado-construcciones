"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Loader2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import { retryLeadEmail } from "@/server/actions/leads";

/** Notification email outcome for a lead, with retry when it failed. */
export function LeadEmailStatus({
  id,
  status,
  info,
}: {
  id: string;
  status: "SENT" | "FAILED" | null;
  info: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status === "SENT") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CircleCheck className="size-4" aria-hidden /> Aviso por email enviado.
      </p>
    );
  }
  if (status !== "FAILED") return null;

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
    >
      <p className="flex items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <span>
          No se pudo enviar el aviso por email.
          {info && <span className="block text-xs text-muted-foreground">{info}</span>}
        </span>
      </p>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await retryLeadEmail(id);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
            router.refresh();
          })
        }
      >
        {pending ? <Loader2 className="animate-spin" /> : <RotateCw />}
        Reintentar envío
      </Button>
    </div>
  );
}
