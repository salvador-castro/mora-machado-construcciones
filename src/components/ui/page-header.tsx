import { Breadcrumbs, type Crumb } from "./breadcrumbs";
import { Eyebrow } from "./eyebrow";
import { Highlighted } from "./heading";
import { Reveal } from "./reveal";
import { Section, type Tone } from "./section";

/** Header for internal pages: breadcrumbs, eyebrow, H1 and lead. */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  highlight,
  subtitle,
  tone = "light",
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string | null;
  title: string;
  highlight?: string | null;
  subtitle?: string | null;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  return (
    <Section tone={tone} spacing={false} className="pt-10 pb-16 lg:pt-14 lg:pb-24">
      <div className="container-site space-y-12 lg:space-y-20">
        <Breadcrumbs items={crumbs} />
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="space-y-6 lg:col-span-8">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            <h1 className="max-w-5xl text-h1">
              <Highlighted text={title} highlight={highlight} />
            </h1>
          </div>
          {subtitle && (
            <Reveal className="lg:col-span-4">
              <p className="text-lead text-current/72">{subtitle}</p>
            </Reveal>
          )}
        </div>
        {children}
      </div>
    </Section>
  );
}
