"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

/** Unexpected error inside a public page (the header and footer stay). */
export default function SiteError({
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
    <Section tone="light" className="flex min-h-[60svh] items-center">
      <div className="container-site max-w-3xl space-y-6">
        <Eyebrow>Error</Eyebrow>
        <h1 className="text-h2">Algo salió mal al cargar esta página.</h1>
        <p className="text-lead text-ink/72">
          Probá de nuevo en unos segundos. Si el problema sigue, escribinos desde la página de
          contacto.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => retry()}>Reintentar</Button>
          <ButtonLink href="/" variant="secondary">
            Volver al inicio
          </ButtonLink>
        </div>
        {error.digest && <p className="text-xs text-ink/64">Código: {error.digest}</p>}
      </div>
    </Section>
  );
}
