import { ButtonLink } from "@/components/ui/button";
import type { SiteSettingsData } from "@/lib/content/queries";
import { primaryWhatsApp, telHref, whatsappUrl } from "@/lib/whatsapp";
import { BrandMark } from "./brand-mark";
import { MenuOverlay } from "./menu-overlay";

export function SiteHeader({ settings }: { settings: SiteSettingsData }) {
  const wa = primaryWhatsApp(settings.phones);
  const contact = [
    ...(wa ? [{ label: "WhatsApp", value: wa.number, href: whatsappUrl(wa.number) }] : []),
    ...settings.phones
      .filter((p) => p !== wa)
      .map((p) => ({ label: p.label, value: p.number, href: telHref(p.number) })),
    ...(settings.email
      ? [{ label: "Email", value: settings.email, href: `mailto:${settings.email}` }]
      : []),
    ...(settings.address ? [{ label: "Ubicación", value: settings.address }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-paper/16 tone-dark">
      <div className="container-site flex h-14 items-center justify-between gap-4">
        <BrandMark brandName={settings.brandName} logo={settings.logo} />
        <div className="flex items-center gap-2">
          <ButtonLink href="/#contacto" size="sm" className="max-sm:hidden">
            Pedir presupuesto
          </ButtonLink>
          <MenuOverlay contact={contact} />
        </div>
      </div>
    </header>
  );
}
