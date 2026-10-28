import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { iconByName } from "@/components/ui/dynamic-icon";
import { IconSquare } from "@/components/ui/icon-square";
import { Reveal } from "@/components/ui/reveal";

export type ServiceItem = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  icon: string | null;
};

/** Dark-tone grid of service cards linking to their detail pages. */
export function ServiceGrid({
  services,
  headingLevel = "h3",
}: {
  services: ServiceItem[];
  headingLevel?: "h2" | "h3";
}) {
  const Title = headingLevel;
  return (
    // Each card draws its own 1px ring (shadow) into the gap, so an incomplete last
    // row leaves empty background instead of a gray filler cell.
    <ul className="grid gap-px p-px sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s, i) => (
        <Reveal
          as="li"
          key={s.id}
          delay={(i % 3) * 0.08}
          className="group relative flex flex-col bg-ink p-6 shadow-[0_0_0_1px_color-mix(in_srgb,var(--paper)_16%,transparent)] transition-colors hover:bg-[color-mix(in_srgb,var(--paper)_4%,var(--ink))] lg:p-8"
        >
          <div className="flex items-start justify-between">
            <IconSquare icon={iconByName(s.icon)} size="sm" />
            <span className="text-eyebrow text-paper/64">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <Title className="mt-10 text-h4">
            <Link href={`/servicios/${s.slug}`} className="after:absolute after:inset-0">
              {s.title}
            </Link>
          </Title>
          <p className="mt-3 flex-1 text-paper/64">{s.shortDescription}</p>
          <ArrowRight
            aria-hidden
            className="mt-8 size-5 text-paper/64 transition-all duration-200 group-hover:translate-x-1 group-hover:text-accent"
          />
        </Reveal>
      ))}
    </ul>
  );
}
