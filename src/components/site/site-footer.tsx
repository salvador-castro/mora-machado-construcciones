import Link from "next/link";
import type { SiteSettingsData } from "@/lib/content/queries";
import { telHref, whatsappUrl } from "@/lib/whatsapp";
import { ButtonLink } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";
import { CurrentYear } from "./current-year";
import { NAV_LINKS } from "./nav-links";

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function SiteFooter({ settings }: { settings: SiteSettingsData }) {
  return (
    <footer className="tone-stone">
      <div className="container-site grid gap-12 py-16 lg:grid-cols-12 lg:py-24">
        <div className="space-y-6 lg:col-span-5">
          <BrandMark
            brandName={settings.brandName}
            tagline={settings.tagline}
            logo={settings.logo}
            showTagline
          />
          {settings.footerText && (
            <p className="max-w-md text-h4 text-paper/88">{settings.footerText}</p>
          )}
          <ButtonLink href="/#contacto">Pedir presupuesto</ButtonLink>
        </div>

        <nav aria-label="Pie de página" className="lg:col-span-3 lg:col-start-7">
          <p className="mb-4 text-eyebrow text-paper/88">Navegación</p>
          <ul className="space-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6 lg:col-span-3">
          <div>
            <p className="mb-4 text-eyebrow text-paper/88">Contacto</p>
            <ul className="space-y-2">
              {settings.phones.map((p) => (
                <li key={p.number}>
                  <a
                    href={
                      p.whatsapp
                        ? whatsappUrl(p.number, settings.whatsappMessage)
                        : telHref(p.number)
                    }
                    className="hover:underline"
                  >
                    {p.number}
                  </a>
                </li>
              ))}
              {settings.email && (
                <li>
                  <a href={`mailto:${settings.email}`} className="hover:underline">
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.address && <li className="text-paper/88">{settings.address}</li>}
              {settings.openingHours && <li className="text-paper/88">{settings.openingHours}</li>}
              {settings.coverage && <li className="text-paper/88">{settings.coverage}</li>}
            </ul>
          </div>
          {settings.socials.length > 0 && (
            <div>
              <p className="mb-4 text-eyebrow text-paper/88">Redes</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {settings.socials.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {SOCIAL_LABELS[s.network] ?? s.network}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-paper/16">
        <div className="container-site flex flex-col gap-3 pt-6 pb-24 text-sm text-paper/88 md:flex-row md:items-center md:justify-between md:py-6 md:pr-24">
          <p>
            © <CurrentYear /> {settings.brandName}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/legales/privacidad" className="hover:underline">
              Política de privacidad
            </Link>
            <p>
              Página Web Diseñada por{" "}
              <a
                href="https://salvacastro.com.ar"
                target="_blank"
                rel="noopener"
                className="font-medium text-paper hover:underline"
              >
                SALVACASTRO
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
