"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Menu, UserCircle } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/admin/ui/sheet";
import { logout } from "@/server/actions/auth";
import { AdminNav } from "./admin-nav";

type ShellUser = { name: string; email: string; role: "ADMIN" | "EDITOR" };

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="inline-flex size-8 items-center justify-center bg-accent text-xs font-semibold text-accent-fg">
        MM
      </span>
      <span className="text-sm leading-tight font-medium">
        Mora Machado
        <span className="block text-xs font-normal text-muted-foreground">Administración</span>
      </span>
    </Link>
  );
}

export function AdminShell({
  user,
  newLeads,
  children,
}: {
  user: ShellUser;
  newLeads: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r bg-card p-4 lg:flex">
        <Brand />
        <AdminNav role={user.role} newLeads={newLeads} />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 overflow-y-auto p-4">
          <SheetHeader className="p-0">
            <SheetTitle className="sr-only">Menú de administración</SheetTitle>
            <Brand />
          </SheetHeader>
          <AdminNav role={user.role} newLeads={newLeads} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </Button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink />
                <span className="max-sm:sr-only">Ver sitio</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Cuenta">
                  <UserCircle />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/cuenta">Mi cuenta</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={logout} className="w-full">
                    <button type="submit" className="flex w-full items-center gap-2">
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
