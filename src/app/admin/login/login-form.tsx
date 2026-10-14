"use client";

import { useActionState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
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
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state?.email}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Ingresar
      </Button>
    </form>
  );
}
