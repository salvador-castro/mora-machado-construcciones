import { notFound } from "next/navigation";
import { CtaSection } from "@/components/home/cta-section";
import { ProjectCard } from "@/components/home/project-card";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MediaImage } from "@/components/ui/media-image";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { RichText } from "@/components/ui/rich-text";
import { Section } from "@/components/ui/section";
import {
  getFeaturedTestimonial,
  getPageContent,
  getServiceBySlug,
  getServiceSlugs,
  getSettings,
} from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";
import { primaryWhatsApp, whatsappUrl } from "@/lib/whatsapp";

// params are awaited before any Suspense so unknown slugs return a real 404 status.
// Known slugs are prerendered, so navigation is still instant in practice.
export const instant = false;

export async function generateStaticParams() {
  const slugs = await getServiceSlugs();
  // Cache Components requires at least one param; the placeholder resolves to 404.
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/servicios/[slug]">) {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  if (!s) return {};
  return pageMetadata({
    title: s.seoTitle || s.title,
    description: s.seoDescription || s.shortDescription,
    path: `/servicios/${s.slug}`,
    image: s.cover,
  });
}

export default async function ServicePage({ params }: PageProps<"/servicios/[slug]">) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) notFound(); // before any Suspense → real 404 status

  const [settings, cta, testimonial, details] = await Promise.all([
    getSettings(),
    getPageContent("home.cta"),
    getFeaturedTestimonial(),
    getPageContent("details"),
  ]);
  const wa = primaryWhatsApp(settings.phones);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Servicios", href: "/servicios" }, { label: service.title }]}
        eyebrow="Servicio"
        title={service.title}
        subtitle={service.shortDescription}
      >
        {service.cover && (
          <div className="aspect-video overflow-hidden">
            <MediaImage
              media={service.cover}
              sizes="100vw"
              priority
              className="size-full object-cover"
            />
          </div>
        )}
      </PageHeader>

      {(service.content || wa) && (
        <Section tone="light-2">
          <div className="container-site grid gap-12 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <RichText html={service.content} />
            </Reveal>
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="space-y-5 bg-paper p-6 lg:sticky lg:top-24 lg:p-8">
                <p className="text-h4">¿Necesitás {service.title.toLowerCase()}?</p>
                {details?.serviceAsideText && (
                  <p className="text-ink/64">{details.serviceAsideText}</p>
                )}
                <div className="flex flex-col gap-2">
                  <ButtonLink href="/contacto" arrow>
                    Pedir presupuesto
                  </ButtonLink>
                  {wa && (
                    <ButtonLink
                      href={whatsappUrl(
                        wa.number,
                        `Hola, les escribo desde la web. Quiero consultar por ${service.title}.`,
                      )}
                      variant="secondary"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Escribir por WhatsApp
                    </ButtonLink>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </Section>
      )}

      {details && service.whyItems.length > 0 && (
        <Section tone="light" aria-labelledby="por-que-title">
          <div className="container-site space-y-12">
            <div className="space-y-5">
              {details.serviceWhyEyebrow && <Eyebrow>{details.serviceWhyEyebrow}</Eyebrow>}
              <h2 id="por-que-title" className="max-w-3xl text-h2">
                {details.serviceWhyTitle}
              </h2>
            </div>
            <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {service.whyItems.map((item, i) => (
                <Reveal as="li" key={i} delay={i * 0.08} className="border-t border-ink/16 pt-6">
                  <p className="text-eyebrow text-ink/64">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-6 text-h4">{item.title}</h3>
                  <p className="mt-2 text-ink/64">{item.description}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {details && service.steps.length > 0 && (
        <Section tone="dark" aria-labelledby="etapas-title">
          <div className="container-site grid gap-12 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-4">
              {details.serviceStepsEyebrow && <Eyebrow>{details.serviceStepsEyebrow}</Eyebrow>}
              <h2 id="etapas-title" className="text-h2">
                {details.serviceStepsTitle}
              </h2>
            </div>
            <ol className="divide-y divide-paper/16 border-y border-paper/16 lg:col-span-7 lg:col-start-6">
              {service.steps.map((step, i) => (
                <Reveal as="li" key={i} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                  <span className="pt-1.5 text-eyebrow text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-h4">{step.title}</h3>
                    <p className="mt-2 text-paper/64">{step.description}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </Section>
      )}

      {service.projects.length > 0 && (
        <Section tone="light-2" aria-labelledby="obras-relacionadas">
          <div className="container-site space-y-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="space-y-5">
                <Eyebrow>Obras</Eyebrow>
                <h2 id="obras-relacionadas" className="text-h2">
                  {service.title}
                </h2>
              </div>
              <ButtonLink href="/obras" variant="secondary" arrow>
                Ver todas
              </ButtonLink>
            </div>
            <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:gap-x-8">
              {service.projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </Section>
      )}

      {cta && <CtaSection content={cta} testimonial={testimonial} />}
    </>
  );
}
