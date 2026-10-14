import { cn } from "@/lib/cn";

type Level = "h1" | "h2" | "h3" | "h4";

const sizeClass: Record<Level, string> = {
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
};

type HeadingProps = React.ComponentPropsWithoutRef<"h2"> & {
  as?: Level;
  /** Visual size; defaults to the semantic level. */
  size?: Level;
};

export function Heading({ as = "h2", size, className, ...props }: HeadingProps) {
  const Comp = as;
  return <Comp className={cn(sizeClass[size ?? as], className)} {...props} />;
}

/**
 * Renders a string with one highlighted fragment, e.g. the hero title with
 * "soluciones concretas" emphasized. Matching is case-sensitive and literal.
 */
export function Highlighted({ text, highlight }: { text: string; highlight?: string | null }) {
  if (!highlight) return text;
  const i = text.indexOf(highlight);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-highlight">{highlight}</span>
      {text.slice(i + highlight.length)}
    </>
  );
}
