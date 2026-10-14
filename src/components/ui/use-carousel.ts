"use client";

import { useCallback, useSyncExternalStore } from "react";
import useEmblaCarousel from "embla-carousel-react";

type EmblaOptions = Parameters<typeof useEmblaCarousel>[0];

const EMPTY = "0|0|0|0";

/** Embla wrapper exposing index/count and prev/next state for custom controls. */
export function useCarousel(options?: EmblaOptions) {
  const [emblaRef, api] = useEmblaCarousel({ align: "start", ...options });

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!api) return () => {};
      api.on("select", notify).on("reInit", notify);
      return () => {
        api.off("select", notify).off("reInit", notify);
      };
    },
    [api],
  );

  // Serialized snapshot keeps referential stability for useSyncExternalStore.
  const snapshot = useSyncExternalStore(
    subscribe,
    () =>
      api
        ? [
            api.selectedScrollSnap(),
            api.scrollSnapList().length,
            Number(api.canScrollPrev()),
            Number(api.canScrollNext()),
          ].join("|")
        : EMPTY,
    () => EMPTY,
  );
  const [index, count, canPrev, canNext] = snapshot.split("|").map(Number);

  return {
    emblaRef,
    index,
    count,
    canPrev: canPrev === 1,
    canNext: canNext === 1,
    prev: useCallback(() => api?.scrollPrev(), [api]),
    next: useCallback(() => api?.scrollNext(), [api]),
  };
}
