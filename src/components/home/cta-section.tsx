import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import type { PageContentData } from "@/lib/content/schemas";

type Testimonial = { quote: string; author: string; role: string | null };

/**
 * Closing call to action, shared by the home and the inner pages. Its link is
 * edited once (home.cta) and usually points to a home anchor (#contacto), which
 * only exists on the home: elsewhere it goes to /#contacto.
 */
export function CtaSection({
  content,
  testimonial,
  onHome = false,
}: {
  content: PageContentData<"home.cta">;
  testimonial: Testimonial | null;
  onHome?: boolean;
}) {
  const showTestimonial = content.showTestimonial && testimonial;
  const href =
    !onHome && content.cta.href.startsWith("#") ? `/${content.cta.href}` : content.cta.href;
  return (
    <Section tone="dark" aria-labelledby="cta-title">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-8">
        <Reveal
          className={showTestimonial ? "space-y-8 lg:col-span-7" : "space-y-8 lg:col-span-10"}
        >
          <h2 id="cta-title" className="text-h1">
            {content.title}
          </h2>
          <p className="max-w-xl text-lead text-paper/72">{content.text}</p>
          <ButtonLink href={href} arrow>
            {content.cta.label}
          </ButtonLink>
        </Reveal>
        {showTestimonial && (
          <Reveal delay={0.08} className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <figure className="border-t border-paper/16 pt-6">
              <blockquote className="text-h4">“{testimonial.quote}”</blockquote>
              <figcaption className="mt-6">
                <p className="font-medium">{testimonial.author}</p>
                {testimonial.role && <p className="text-sm text-paper/64">{testimonial.role}</p>}
              </figcaption>
            </figure>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
