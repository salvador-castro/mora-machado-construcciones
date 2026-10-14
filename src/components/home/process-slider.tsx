"use client";

import { CarouselControls } from "@/components/ui/carousel-controls";
import { useCarousel } from "@/components/ui/use-carousel";

type Step = { id: string; title: string; description: string };

export function ProcessSlider({ steps }: { steps: Step[] }) {
  const { emblaRef, index, count, canPrev, canNext, prev, next } = useCarousel({
    containScroll: "trimSnaps",
  });
  return (
    <div className="space-y-8">
      <div className="overflow-hidden" ref={emblaRef}>
        <ol className="-ml-4 flex touch-pan-y lg:-ml-6">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className="min-w-0 flex-[0_0_85%] pl-4 sm:flex-[0_0_55%] lg:flex-[0_0_36%] lg:pl-6"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${steps.length}`}
            >
              <div className="flex h-full min-h-80 flex-col justify-between border border-ink/16 bg-paper p-6 lg:min-h-96 lg:p-8">
                <p className="text-h1 text-ink/16" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="text-h4">{step.title}</h3>
                  <p className="mt-3 text-ink/64">{step.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <CarouselControls
        index={index}
        count={count}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={prev}
        onNext={next}
        className="justify-end"
      />
    </div>
  );
}
