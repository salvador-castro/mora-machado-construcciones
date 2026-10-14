"use client";

import { useEffect } from "react";

/** Last-resort error UI when the root layout itself fails (no site styles available). */
export default function GlobalError({
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
    <html lang="es-AR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f3f0",
          color: "#111a0d",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 480, padding: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 500 }}>El sitio no está disponible</h1>
          <p style={{ lineHeight: 1.5 }}>
            Estamos teniendo un problema. Probá de nuevo en unos minutos.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 8,
              padding: "12px 20px",
              border: 0,
              background: "#111a0d",
              color: "#f4f3f0",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          {error.digest && <p style={{ fontSize: 12, opacity: 0.7 }}>Código: {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
