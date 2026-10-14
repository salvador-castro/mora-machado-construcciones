import { cn } from "@/lib/cn";
import { Eyebrow } from "./eyebrow";
import { Heading, Highlighted } from "./heading";
import { Reveal } from "./reveal";

type SectionHeaderProps = {
  eyebrow?: string | null;
  title: string;
  highlight?: string | null;
  subtitle?: string | null;
  /** Right-aligned actions on desktop (e.g. "Ver todas"). */
  actions?: React.ReactNode;
  as?: "h1" | "h2";
  size?: "h1" | "h2" | "h3";
  className?: string;
  id?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  actions,
  as = "h2",
  size,
  className,
  id,
}: SectionHeaderProps) {
  return (
    <Reveal className={cn("grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-8", className)}>
      <div className="space-y-5 lg:col-span-8">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading as={as} size={size ?? as} id={id} className="max-w-4xl">
          <Highlighted text={title} highlight={highlight} />
        </Heading>
      </div>
      {(subtitle || actions) && (
        <div className="space-y-6 lg:col-span-4">
          {subtitle && <p className="max-w-md text-current/72">{subtitle}</p>}
          {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
        </div>
      )}
    </Reveal>
  );
}
