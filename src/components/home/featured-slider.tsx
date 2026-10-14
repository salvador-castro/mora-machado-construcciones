"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CarouselControls } from "@/components/ui/carousel-controls";
import { MediaImage } from "@/components/ui/media-image";
import { useCarousel } from "@/components/ui/use-carousel";
import type { ProjectCardData } from "@/lib/content/queries";

export function FeaturedSlider({ projects }: { projects: ProjectCardData[] }) {
  const { emblaRef, index, count, canPrev, canNext, prev, next } = useCarousel({
    loop: projects.length > 2,
  });
  return (
    <div className="space-y-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {projects.map((p, i) => (
            <article
              key={p.id}
              className="grid min-w-0 flex-[0_0_100%] gap-8 lg:grid-cols-12 lg:gap-8"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${projects.length}`}
            >
              <div className="aspect-4/3 overflow-hidden bg-paper/8 lg:col-span-7">
                {p.cover && (
                  <MediaImage
                    media={p.cover}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="size-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col justify-end gap-6 lg:col-span-5 lg:pb-2">
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-eyebrow text-paper/48">Categoría</dt>
                    <dd className="mt-1">{p.category.name}</dd>
                  </div>
                  <div>
                    <dt className="text-eyebrow text-paper/48">Ubicación</dt>
                    <dd className="mt-1">{p.location}</dd>
                  </div>
                </dl>
                <h3 className="text-h3">{p.title}</h3>
                <p className="max-w-md text-paper/72">{p.excerpt}</p>
                <Link
                  href={`/obras/${p.slug}`}
                  className="group inline-flex items-center gap-2 font-medium hover:text-accent"
                >
                  Ver obra
                  <ArrowRight
                    aria-hidden
                    className="size-4 transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <CarouselControls
        index={index}
        count={count}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}
