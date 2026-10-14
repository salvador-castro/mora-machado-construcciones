import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";

export function NotFoundContent() {
  return (
    <Section tone="light" className="flex min-h-[70svh] items-center">
      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Eyebrow>Error 404</Eyebrow>
          <h1 className="text-h1">Esta página no está en obra.</h1>
          <p className="max-w-xl text-lead text-ink/72">
            Puede que el enlace haya cambiado o que la página ya no exista. Te dejamos algunos
            caminos para seguir.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/">Volver al inicio</ButtonLink>
            <ButtonLink href="/obras" variant="secondary">
              Ver obras
            </ButtonLink>
            <ButtonLink href="/contacto" variant="link">
              Contacto
            </ButtonLink>
          </div>
        </div>
        {/* Decorative, rendered as CSS content (the h1 already says it). */}
        <p
          aria-hidden
          data-n="404"
          className="text-[clamp(8rem,20vw,18rem)] leading-none font-medium tracking-tighter text-ink/8 before:content-[attr(data-n)] lg:col-span-4 lg:text-right"
        />
      </div>
    </Section>
  );
}
