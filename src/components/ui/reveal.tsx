"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Delay in seconds (use for manual stagger: index * 0.08). */
  delay?: number;
  as?: "div" | "li" | "article";
};

/**
 * Fade + rise on scroll into view (CSS transition, see [data-reveal] in
 * globals.css). Static with reduced motion; visible without JS via <noscript>.
 */
export function Reveal({ children, className, delay = 0, as: Comp = "div" }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Comp
      ref={ref as React.Ref<never>}
      data-reveal={shown ? "in" : ""}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </Comp>
  );
}
