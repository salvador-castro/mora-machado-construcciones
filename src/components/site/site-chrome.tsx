import { JsonLd } from "@/components/seo/json-ld";
import { GridLines } from "@/components/ui/grid-lines";
import { getSettings } from "@/lib/content/queries";
import { mediaAbsoluteUrl, siteUrl } from "@/lib/seo";
import { primaryWhatsApp } from "@/lib/whatsapp";
import { AnnouncementBar } from "./announcement-bar";
import { PreviewBanner } from "./preview-banner";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppButton } from "./whatsapp-button";

/** Public site frame. Used by the (site) layout and the root 404. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const wa = primaryWhatsApp(settings.phones);
  const mainPhone = wa ?? settings.phones[0];

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 tone-dark px-4 py-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <PreviewBanner />
      {settings.announcementEnabled && settings.announcementText && (
        <AnnouncementBar text={settings.announcementText} url={settings.announcementUrl} />
      )}
      <SiteHeader settings={settings} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      {wa && <WhatsAppButton number={wa.number} message={settings.whatsappMessage} />}
      <GridLines />
      <JsonLd
        data={{
          "@type": "GeneralContractor",
          "@id": siteUrl("/#empresa"),
          name: settings.brandName,
          description: settings.defaultSeoDescription,
          slogan: settings.tagline,
          url: siteUrl("/"),
          logo: mediaAbsoluteUrl(settings.logo),
          image: mediaAbsoluteUrl(settings.defaultOgImage ?? settings.logo),
          telephone: mainPhone?.number,
          email: settings.email ?? undefined,
          address: settings.address
            ? { "@type": "PostalAddress", addressLocality: settings.address, addressCountry: "AR" }
            : undefined,
          areaServed: settings.coverage ?? undefined,
          sameAs: settings.socials.length ? settings.socials.map((s) => s.url) : undefined,
        }}
      />
    </>
  );
}
