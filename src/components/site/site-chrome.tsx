import { getSettings } from "@/lib/content/queries";
import { primaryWhatsApp } from "@/lib/whatsapp";
import { AnnouncementBar } from "./announcement-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppButton } from "./whatsapp-button";

/** Public site frame. Used by the (site) layout and the root 404. */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const wa = primaryWhatsApp(settings.phones);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 tone-dark px-4 py-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      {settings.announcementEnabled && settings.announcementText && (
        <AnnouncementBar text={settings.announcementText} url={settings.announcementUrl} />
      )}
      <SiteHeader settings={settings} />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
      {wa && (
        <WhatsAppButton
          number={wa.number}
          message="Hola, quiero hacer una consulta sobre una obra."
        />
      )}
    </>
  );
}
