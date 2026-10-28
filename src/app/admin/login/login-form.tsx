"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { login } from "@/server/actions/auth";

// Read the query string on the client so the login page can stay fully static.
const subscribe = () => () => {};
const getSearch = () => window.location.search;
const getServerSearch = () => "";

export function LoginForm() {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const params = new URLSearchParams(search);
  // Server action passed directly → the form works even before hydration.
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={params.get("next") ?? ""} />
      {params.has("expired") && !state && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Tu sesión terminó. Volvé a ingresar.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="tu@email.com"
            defaultValue={state?.email}
            aria-invalid={state?.error ? true : undefined}
            className="h-11 pl-9"
            required
            autoFocus
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Tu contraseña"
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={capsLock ? "caps-lock" : undefined}
            className="h-11 px-9"
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
            onBlur={() => setCapsLock(false)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            title={showPassword ? "Ocultar" : "Mostrar"}
            className="absolute top-1/2 right-1.5 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            <span className="sr-only">{showPassword ? "Ocultar" : "Mostrar"} lo escrito</span>
          </button>
        </div>
        {capsLock && (
          <p id="caps-lock" className="text-xs text-muted-foreground">
            Bloq Mayús está activado.
          </p>
        )}
      </div>
      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
