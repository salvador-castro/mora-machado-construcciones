import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaImage } from "@/components/ui/media-image";
import type { ProjectCardData } from "@/lib/content/queries";
import { cn } from "@/lib/cn";

export function ProjectCard({
  project,
  sizes = "(min-width: 768px) 50vw, 100vw",
  className,
}: {
  project: ProjectCardData;
  sizes?: string;
  className?: string;
}) {
  const href = `/obras/${project.slug}`;
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="aspect-4/3 overflow-hidden bg-ink/8">
        {project.cover && (
          <MediaImage
            media={project.cover}
            sizes={sizes}
            className="size-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        )}
      </div>
      <p className="mt-6 text-eyebrow text-current/64">{project.category.name}</p>
      <h3 className="mt-3 text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-[1.1] font-medium tracking-[-0.03em]">
        <Link href={href} className="after:absolute after:inset-0">
          {project.title}
        </Link>
      </h3>
      <p className="mt-3 max-w-xl text-current/72">{project.excerpt}</p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-current/16 pt-4">
        <div>
          <dt className="text-eyebrow text-current/64">Ubicación</dt>
          <dd className="mt-1">{project.location}</dd>
        </div>
        {project.service && (
          <div>
            <dt className="text-eyebrow text-current/64">Servicio</dt>
            <dd className="mt-1">{project.service.title}</dd>
          </div>
        )}
      </dl>
      <p aria-hidden className="mt-6 inline-flex items-center gap-2 font-medium">
        Ver obra
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
      </p>
    </article>
  );
}
