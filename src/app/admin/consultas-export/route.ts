import { LEAD_STATUS_LABEL } from "@/lib/admin/labels";
import { leadWhere, parseLeadFilter } from "@/lib/admin/leads";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

function csvCell(value: string | null | undefined) {
  const v = value ?? "";
  // Neutralize spreadsheet formulas (CSV injection).
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** CSV of leads with the same filters as /admin/consultas (UTF-8 BOM for Excel). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const sp = Object.fromEntries(new URL(request.url).searchParams);
  const leads = await db.lead.findMany({
    where: leadWhere(parseLeadFilter(sp)),
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = [
    "Fecha",
    "Estado",
    "Nombre",
    "Teléfono",
    "Email",
    "Presupuesto",
    "Mensaje",
    "Página",
    "Notas",
  ];
  const lines = leads.map((l) =>
    [
      l.createdAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
      LEAD_STATUS_LABEL[l.status],
      l.name,
      l.phone,
      l.email,
      l.budgetRange,
      l.message,
      l.sourcePage,
      l.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  const body = "﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n");
  const day = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consultas-${day}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
