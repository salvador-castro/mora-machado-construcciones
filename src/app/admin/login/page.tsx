import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
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
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
