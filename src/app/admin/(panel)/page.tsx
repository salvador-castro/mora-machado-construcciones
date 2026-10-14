import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CircleCheck,
  Circle,
  ImagePlus,
  Inbox,
  LayoutTemplate,
  Newspaper,
  Settings,
} from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, timeAgo } from "@/lib/admin/labels";
import { requireUser } from "@/lib/auth/session";
import { todosSchema } from "@/lib/content/schemas";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Inicio" };
// Admin pages read the session per request (see CLAUDE.md).
export const instant = false;

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const user = await requireUser();
  const sp = await searchParams;

  const [newLeads, projects, services, posts, drafts, latestLeads, settings] = await Promise.all([
    db.lead.count({ where: { status: "NEW" } }),
    db.project.count({ where: { published: true } }),
    db.service.count({ where: { published: true } }),
    db.blogPost.count({ where: { status: "PUBLISHED" } }),
    db.blogPost.count({ where: { status: "DRAFT" } }),
    db.lead.findMany({
      where: { status: { not: "SPAM" } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, message: true, status: true, createdAt: true },
    }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { pendingTodos: true } }),
  ]);
  const todos = todosSchema.catch([]).parse(settings?.pendingTodos);
  const now = new Date();

  const stats = [
    {
      label: "Consultas nuevas",
      value: newLeads,
      href: "/admin/consultas",
      icon: Inbox,
      highlight: newLeads > 0,
    },
    { label: "Obras publicadas", value: projects, href: "/admin/obras", icon: Building2 },
    { label: "Servicios", value: services, href: "/admin/servicios", icon: LayoutTemplate },
    {
      label: "Notas publicadas",
      value: posts,
      hint: drafts ? `${drafts} en borrador` : undefined,
      href: "/admin/blog",
      icon: Newspaper,
    },
  ];

  const shortcuts = [
    { label: "Nueva obra", href: "/admin/obras/nueva", icon: Building2 },
    { label: "Subir imágenes", href: "/admin/medios", icon: ImagePlus },
    { label: "Editar portada", href: "/admin/secciones/home.hero", icon: LayoutTemplate },
    { label: "Configuración", href: "/admin/configuracion", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {"denied" in sp && (
        <p
          role="alert"
          className="mb-6 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          No tenés permisos para acceder a esa sección.
        </p>
      )}
      <PageTitle
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Resumen del sitio y accesos rápidos."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className={cn(
              "group rounded-lg border bg-card p-4 transition-colors hover:border-foreground/40",
              s.highlight && "border-ink bg-ink text-paper hover:border-ink",
            )}
          >
            <s.icon
              className={cn("size-5", s.highlight ? "text-accent" : "text-muted-foreground")}
              aria-hidden
            />
            <p className="mt-4 text-3xl font-medium tabular-nums">{s.value}</p>
            <p className={cn("text-sm", s.highlight ? "text-paper/72" : "text-muted-foreground")}>
              {s.label}
            </p>
            {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas consultas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/consultas">
                Ver todas <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {latestLeads.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no llegaron consultas desde el formulario.
              </p>
            ) : (
              <ul className="divide-y">
                {latestLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/consultas/${lead.id}`}
                      className="flex items-start gap-3 py-3 hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{lead.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{lead.message}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs",
                            LEAD_STATUS_TONE[lead.status],
                          )}
                        >
                          {LEAD_STATUS_LABEL[lead.status]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(lead.createdAt, now)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Accesos rápidos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {shortcuts.map((s) => (
                <Button
                  key={s.href}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4"
                  asChild
                >
                  <Link href={s.href}>
                    <s.icon aria-hidden />
                    <span className="text-xs">{s.label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          {todos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pendientes del cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {todos.map((t) => (
                    <li key={t.id} className="flex gap-2">
                      {t.done ? (
                        <CircleCheck
                          className="mt-0.5 size-4 shrink-0 text-emerald-700"
                          aria-label="Hecho"
                        />
                      ) : (
                        <Circle
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-label="Pendiente"
                        />
                      )}
                      <span className={cn(t.done && "text-muted-foreground line-through")}>
                        {t.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Se marcan como resueltos desde Configuración.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
