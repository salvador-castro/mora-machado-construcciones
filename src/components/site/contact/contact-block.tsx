import { Eyebrow } from "@/components/ui/eyebrow";
import { Reveal } from "@/components/ui/reveal";
import type { SiteSettingsData } from "@/lib/content/queries";
import type { PageContentData } from "@/lib/content/schemas";
import { primaryWhatsApp, telHref, whatsappUrl } from "@/lib/whatsapp";
import { ContactForm } from "./contact-form";

/** Contact data + form. Used on the home (#contacto) and on /contacto. */
export function ContactBlock({
  content,
  settings,
  sourcePage,
  headingLevel = "h2",
}: {
  content: PageContentData<"home.contact">;
  settings: SiteSettingsData;
  sourcePage: string;
  headingLevel?: "h2" | "h3";
}) {
  const Title = headingLevel;
  const wa = primaryWhatsApp(settings.phones);

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
      <Reveal className="space-y-8 lg:col-span-5">
        <div className="space-y-5">
          {content.eyebrow && <Eyebrow>{content.eyebrow}</Eyebrow>}
          <Title className="text-h2">{content.title}</Title>
          <p className="max-w-md text-ink/72">{content.text}</p>
        </div>
        <dl className="divide-y divide-ink/16 border-y border-ink/16">
          {settings.phones.map((p) => (
            <div key={p.number} className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-eyebrow text-ink/72">
                {p.whatsapp && !/whatsapp/i.test(p.label) ? `${p.label} · WhatsApp` : p.label}
              </dt>
              <dd className="text-right">
                <a
                  href={p.whatsapp ? whatsappUrl(p.number) : telHref(p.number)}
                  target={p.whatsapp ? "_blank" : undefined}
                  rel={p.whatsapp ? "noopener noreferrer" : undefined}
                  className="text-h4 hover:underline"
                >
                  {p.number}
                </a>
              </dd>
            </div>
          ))}
          {settings.email && (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-eyebrow text-ink/72">Email</dt>
              <dd>
                <a href={`mailto:${settings.email}`} className="hover:underline">
                  {settings.email}
                </a>
              </dd>
            </div>
          )}
          {settings.address && (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-eyebrow text-ink/72">Ubicación</dt>
              <dd className="text-right">{settings.address}</dd>
            </div>
          )}
          {settings.coverage && (
            <div className="flex items-baseline justify-between gap-4 py-4">
              <dt className="text-eyebrow text-ink/72">Cobertura</dt>
              <dd className="text-right">{settings.coverage}</dd>
            </div>
          )}
        </dl>
      </Reveal>

      <Reveal delay={0.08} className="lg:col-span-7">
        <div className="bg-paper p-6 sm:p-8 lg:p-10">
          <div className="mb-8 space-y-3">
            {content.formEyebrow && <Eyebrow>{content.formEyebrow}</Eyebrow>}
            <Title className="text-h3">{content.formTitle}</Title>
            <p className="text-ink/64">{content.formText}</p>
          </div>
          <ContactForm
            budgetRanges={settings.budgetRanges}
            whatsappNumber={wa?.number ?? null}
            sourcePage={sourcePage}
            consentText={content.consentText}
            turnstileSiteKey={process.env.TURNSTILE_SITE_KEY || undefined}
          />
        </div>
      </Reveal>
    </div>
  );
}
