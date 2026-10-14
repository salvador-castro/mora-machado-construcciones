"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/home/project-card";
import type { ProjectCardData } from "@/lib/content/queries";
import { cn } from "@/lib/cn";

type Category = { id: string; slug: string; name: string };

/** Client-side category filter so /obras stays fully static. */
export function ProjectsExplorer({
  projects,
  categories,
}: {
  projects: ProjectCardData[];
  categories: Category[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const visible = active ? projects.filter((p) => p.category.slug === active) : projects;

  const chip = (slug: string | null, label: string, count: number) => (
    <button
      key={slug ?? "all"}
      type="button"
      aria-pressed={active === slug}
      onClick={() => setActive(slug)}
      className={cn(
        "inline-flex h-10 items-center gap-2 border px-4 text-sm transition-colors",
        active === slug ? "border-ink bg-ink text-paper" : "border-ink/24 hover:border-ink",
      )}
    >
      {label}
      <span className={active === slug ? "text-paper/64" : "text-ink/48"}>{count}</span>
    </button>
  );

  return (
    <div className="space-y-12">
      {categories.length > 1 && (
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
          {chip(null, "Todas", projects.length)}
          {categories.map((c) =>
            chip(c.slug, c.name, projects.filter((p) => p.category.slug === c.slug).length),
          )}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {visible.length} {visible.length === 1 ? "obra" : "obras"}
      </p>
      <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:gap-x-8">
        {visible.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
