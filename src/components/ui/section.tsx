import { cn } from "@/lib/cn";

export type Tone = "dark" | "light" | "light-2" | "sand" | "stone";

const toneClass: Record<Tone, string> = {
  dark: "tone-dark",
  light: "tone-light",
  "light-2": "tone-light-2",
  sand: "tone-sand",
  stone: "tone-stone",
};

type SectionProps = React.ComponentPropsWithoutRef<"section"> & {
  tone?: Tone;
  /** Apply default vertical rhythm (80px mobile / 120px desktop). */
  spacing?: boolean;
};

export function Section({ tone = "light", spacing = true, className, ...props }: SectionProps) {
  return (
    <section
      className={cn("relative", toneClass[tone], spacing && "section-y", className)}
      {...props}
    />
  );
}
