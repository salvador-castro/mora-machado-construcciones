"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/admin/ui/badge";
import { Input } from "@/components/admin/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/admin/ui/table";

export type PostRow = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  category: string | null;
  author: string | null;
  date: string;
};

export function PostsTable({ rows }: { rows: PostRow[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => r.title.toLowerCase().includes(q)) : rows;

  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        Todavía no hay notas.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título"
          aria-label="Buscar notas"
          className="pl-9"
        />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead className="hidden sm:table-cell">Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden text-right md:table-cell">Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="w-full max-w-0">
                  <Link
                    href={`/admin/blog/${r.id}`}
                    className="block truncate font-medium hover:underline"
                  >
                    {r.title}
                  </Link>
                  {r.author && (
                    <span className="block truncate text-xs text-muted-foreground">{r.author}</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {r.category ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={r.status === "PUBLISHED" ? "default" : "outline"}>
                    {r.status === "PUBLISHED" ? "Publicada" : "Borrador"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right whitespace-nowrap text-muted-foreground md:table-cell">
                  {r.date}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Ninguna nota coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
