"use client";

import { useTransition } from "react";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

type Result<D> =
  | { ok: true; message?: string; data?: D }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Submits RHF values to a server action; maps fieldErrors back to inputs and toasts. */
export function useActionForm<T extends FieldValues, D = unknown>(
  form: UseFormReturn<T>,
  action: (values: T) => Promise<Result<D>>,
  { onSuccess }: { onSuccess?: (data: D | undefined) => void } = {},
) {
  const [pending, startTransition] = useTransition();

  const submit = form.handleSubmit(
    (values) =>
      startTransition(async () => {
        const res = await action(values);
        if (res.ok) {
          toast.success(res.message ?? "Guardado.");
          form.reset(values);
          onSuccess?.(res.data);
        } else {
          for (const [path, message] of Object.entries(res.fieldErrors ?? {})) {
            form.setError(path as Path<T>, { message });
          }
          toast.error(res.error);
        }
      }),
    () => toast.error("Revisá los campos marcados."),
  );

  return { submit, pending };
}
