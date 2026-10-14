import { ContactBlock } from "@/components/site/contact/contact-block";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getPageContent, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPageContent("contact");
  return pageMetadata({ title: "Contacto", description: page?.subtitle, path: "/contacto" });
}

export default async function ContactPage() {
  const [page, block, settings] = await Promise.all([
    getPageContent("contact"),
    getPageContent("home.contact"),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Contacto" }]}
        eyebrow={page?.eyebrow}
        title={page?.title ?? "Contacto"}
        highlight={page?.highlight}
        subtitle={page?.subtitle}
      />
      {block && (
        <Section id="contacto" tone="sand">
          <div className="container-site">
            <ContactBlock content={block} settings={settings} sourcePage="/contacto" />
          </div>
        </Section>
      )}
      {page?.showMap && settings.mapEmbedUrl && (
        <section aria-label="Mapa" className="tone-light">
          <iframe
            src={settings.mapEmbedUrl}
            title={`Ubicación de ${settings.brandName}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[420px] w-full border-0 grayscale-[0.4] lg:h-[520px]"
          />
        </section>
      )}
    </>
  );
}
