"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/admin/ui/button";

/** Unexpected error in an admin page (the panel shell stays). */
export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto max-w-xl space-y-4 rounded-lg border bg-card p-6">
      <h1 className="text-xl font-medium">Algo salió mal</h1>
      <p className="text-sm text-muted-foreground">
        No se pudo cargar esta pantalla. Los cambios que ya guardaste no se pierden.
        {error.digest && <> Código para soporte: {error.digest}.</>}
      </p>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/admin">Ir al inicio del panel</Link>
        </Button>
      </div>
    </div>
  );
}
