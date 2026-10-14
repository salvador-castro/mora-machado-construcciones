import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

async function LoginFormWithParams({ searchParams }: PageProps<"/admin/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const expired = "expired" in sp;
  return (
    <>
      {expired && (
        <p className="mb-5 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Tu sesión terminó. Volvé a ingresar.
        </p>
      )}
      <LoginForm next={next} />
    </>
  );
}

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center bg-accent text-sm font-semibold text-accent-fg">
            MM
          </span>
          <div>
            <p className="font-medium">Panel de administración</p>
            <p className="text-sm text-muted-foreground">Mora Machado Construcciones</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-xs">
          <Suspense fallback={<LoginForm />}>
            <LoginFormWithParams {...props} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
