import { CtaSection } from "@/components/home/cta-section";
import { ProcessSection } from "@/components/home/process-section";
import { ValuesSection } from "@/components/home/values-section";
import { ButtonLink } from "@/components/ui/button";
import { MediaImage } from "@/components/ui/media-image";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { RichText } from "@/components/ui/rich-text";
import { Section } from "@/components/ui/section";
import {
  getFeaturedTestimonial,
  getMedia,
  getPageContent,
  getProcessSteps,
  getValueItems,
} from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const about = await getPageContent("about");
  return pageMetadata({
    title: "Nosotros",
    description: about?.subtitle,
    path: "/nosotros",
    image: await getMedia(about?.imageId),
  });
}

export default async function AboutPage() {
  const [about, values, valueItems, process, steps, cta, testimonial] = await Promise.all([
    getPageContent("about"),
    getPageContent("home.values"),
    getValueItems(),
    getPageContent("home.process"),
    getProcessSteps(),
    getPageContent("home.cta"),
    getFeaturedTestimonial(),
  ]);
  const image = await getMedia(about?.imageId);
  const valuesImage = await getMedia(values?.imageId);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Nosotros" }]}
        eyebrow={about?.eyebrow}
        title={about?.title ?? "Nosotros"}
        highlight={about?.highlight}
        subtitle={about?.subtitle}
      >
        {image && (
          <div className="aspect-video overflow-hidden">
            <MediaImage media={image} sizes="100vw" priority className="size-full object-cover" />
          </div>
        )}
      </PageHeader>

      {about?.body && (
        <Section tone="light-2">
          <div className="container-site grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7 lg:col-start-4">
              <RichText html={about.body} className="text-lg" />
              <div className="mt-10">
                <ButtonLink href={about.cta.href} arrow>
                  {about.cta.label}
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </Section>
      )}

      {about?.showValues && values && valueItems.length > 0 && (
        <ValuesSection content={values} items={valueItems} image={valuesImage} />
      )}
      {about?.showProcess && process && <ProcessSection content={process} steps={steps} />}
      {cta && <CtaSection content={cta} testimonial={testimonial} />}
    </>
  );
}
