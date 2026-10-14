import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";
import { LeadStatus } from "@/generated/prisma/enums";
import { LEAD_STATUS_LABEL, LEAD_STATUS_TONE, timeAgo } from "@/lib/admin/labels";
import { LEAD_PAGE_SIZE, leadWhere, parseLeadFilter, type LeadFilter } from "@/lib/admin/leads";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Consultas" };
export const instant = false;

function href(filter: LeadFilter, page = 1) {
  const sp = new URLSearchParams();
  if (filter.status !== "ALL") sp.set("estado", filter.status);
  if (filter.q) sp.set("q", filter.q);
  if (page > 1) sp.set("pagina", String(page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "?";
}

export default async function LeadsPage({ searchParams }: PageProps<"/admin/consultas">) {
  await requireUser();
  const sp = await searchParams;
  const filter = parseLeadFilter(sp);
  const page = Math.max(1, Number(sp.pagina) || 1);
  const where = leadWhere(filter);

  const [leads, total, counts] = await Promise.all([
    db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LEAD_PAGE_SIZE,
      take: LEAD_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        phone: true,
        message: true,
        status: true,
        sourcePage: true,
        createdAt: true,
      },
    }),
    db.lead.count({ where }),
    db.lead.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: LeadStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const allCount = counts.filter((c) => c.status !== "SPAM").reduce((n, c) => n + c._count, 0);
  const pages = Math.max(1, Math.ceil(total / LEAD_PAGE_SIZE));
  const now = new Date();

  const tabs: { value: LeadFilter["status"]; label: string; count: number }[] = [
    { value: "ALL", label: "Todas", count: allCount },
    ...Object.values(LeadStatus).map((s) => ({
      value: s,
      label: LEAD_STATUS_LABEL[s],
      count: countOf(s),
    })),
  ];
  const exportQs = href(filter).slice(1);

  return (
    <div className="mx-auto max-w-5xl">
      <PageTitle
        title="Consultas"
        description="Lo que llega desde el formulario de contacto del sitio."
        actions={
          <Button variant="outline" asChild>
            <a href={`/admin/consultas-export${exportQs ? `?${exportQs}` : ""}`} download>
              <Download /> Exportar CSV
            </a>
          </Button>
        }
      />

      <nav aria-label="Filtrar por estado" className="mb-4 flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const active = filter.status === t.value;
          return (
            <Link
              key={t.value}
              href={href({ ...filter, status: t.value })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                active ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {t.label}
              <span className={cn("text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </nav>

      <form className="relative mb-4 max-w-sm" role="search">
        {filter.status !== "ALL" && <input type="hidden" name="estado" value={filter.status} />}
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={filter.q}
          placeholder="Buscar por nombre, teléfono, email o texto"
          aria-label="Buscar consultas"
          className="pl-9"
        />
      </form>

      {leads.length === 0 ? (
        <p className="rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {filter.q || filter.status !== "ALL"
            ? "No hay consultas con ese filtro."
            : "Todavía no llegaron consultas."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consulta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden text-right md:table-cell">Recibida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id} className={cn(l.status === "NEW" && "font-medium")}>
                  <TableCell className="w-full max-w-0">
                    <Link href={`/admin/consultas/${l.id}`} className="block hover:underline">
                      <span className="block truncate">
                        {l.name} · <span className="font-normal">{l.phone}</span>
                      </span>
                    </Link>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {l.message}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        LEAD_STATUS_TONE[l.status],
                      )}
                    >
                      {LEAD_STATUS_LABEL[l.status]}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right font-normal whitespace-nowrap text-muted-foreground md:table-cell">
                    {timeAgo(l.createdAt, now)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-2 text-sm">
          <Button variant="outline" size="sm" asChild disabled={page <= 1}>
            {page > 1 ? <Link href={href(filter, page - 1)}>Anterior</Link> : <span>Anterior</span>}
          </Button>
          <span className="text-muted-foreground">
            Página {page} de {pages} · {total} consultas
          </span>
          <Button variant="outline" size="sm" asChild disabled={page >= pages}>
            {page < pages ? (
              <Link href={href(filter, page + 1)}>Siguiente</Link>
            ) : (
              <span>Siguiente</span>
            )}
          </Button>
        </nav>
      )}
    </div>
  );
}
