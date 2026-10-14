import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HardHat, Ruler, Handshake } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section, type Tone } from "@/components/ui/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Heading, Highlighted } from "@/components/ui/heading";
import { Button, ButtonLink } from "@/components/ui/button";
import { IconSquare } from "@/components/ui/icon-square";
import { Marquee } from "@/components/ui/marquee";
import { Reveal } from "@/components/ui/reveal";
import { GridLines } from "@/components/ui/grid-lines";
import { AccentSwitcher } from "./accent-switcher";

// Internal page. Sample copy below is placeholder for visual QA only.
// TODO(F6): restrict to authenticated ADMIN instead of dev-only.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

const swatches = [
  { name: "ink", className: "bg-ink text-paper", hex: "#111A0D" },
  { name: "paper", className: "bg-paper text-ink border border-ink/16", hex: "#F4F3F0" },
  { name: "paper-2", className: "bg-paper-2 text-ink border border-ink/16", hex: "#F4F3EA" },
  { name: "sand", className: "bg-sand text-ink", hex: "#CFC9BE" },
  { name: "stone", className: "bg-stone text-paper", hex: "#5E5A53" },
  { name: "accent", className: "bg-accent text-accent-fg", hex: "runtime" },
];

const inkScale = [8, 16, 32, 48, 64, 88] as const;
const inkBg: Record<(typeof inkScale)[number], string> = {
  8: "bg-ink/8",
  16: "bg-ink/16",
  32: "bg-ink/32",
  48: "bg-ink/48",
  64: "bg-ink/64",
  88: "bg-ink/88",
};

const tones: Tone[] = ["light", "light-2", "dark", "sand", "stone"];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main>
      <Section tone="light">
        <Container className="space-y-6">
          <Eyebrow>Styleguide interna</Eyebrow>
          <Heading as="h1">Sistema de diseño</Heading>
          <p className="max-w-2xl text-lead text-ink/64">
            Tokens, tipografía y componentes base. Esta página no se indexa y solo está disponible
            en desarrollo.
          </p>
          <AccentSwitcher />
        </Container>
      </Section>

      <Section tone="light-2">
        <Container className="space-y-10">
          <Heading size="h3">Color</Heading>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {swatches.map((s) => (
              <div
                key={s.name}
                className={`flex aspect-square flex-col justify-end p-4 ${s.className}`}
              >
                <p className="text-eyebrow">{s.name}</p>
                <p className="text-sm opacity-70">{s.hex}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {inkScale.map((o) => (
              <div key={o} className={`flex h-16 items-end p-2 ${inkBg[o]}`}>
                <span className={`text-xs ${o >= 48 ? "text-paper" : ""}`}>ink/{o}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="light">
        <Container className="space-y-8">
          <Heading size="h3">Tipografía</Heading>
          <div className="space-y-8 border-t border-ink/16 pt-8">
            <Heading as="h1">Obras reales, soluciones concretas.</Heading>
            <Heading as="h2">Proceso simple, obra ordenada.</Heading>
            <Heading as="h3">Servicios pensados para resolver.</Heading>
            <Heading as="h4">Construcciones nuevas</Heading>
            <p className="max-w-3xl text-lead">
              Lead — Trabajamos con una mirada práctica, cercana y orientada a resolver.
            </p>
            <p className="max-w-2xl text-ink/64">
              Body — Desarrollo de proyectos desde etapa inicial, con planificación, ejecución y
              seguimiento de cada avance.
            </p>
            <Eyebrow>Nuestros servicios</Eyebrow>
          </div>
        </Container>
      </Section>

      {tones.map((tone) => (
        <Section key={tone} tone={tone}>
          <Container className="space-y-8">
            <Eyebrow>Tono: {tone}</Eyebrow>
            <Heading size="h3">
              <Highlighted text="Botones sobre fondo de prueba" highlight="fondo de prueba" />
            </Heading>
            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink href="#">Pedir presupuesto</ButtonLink>
              <ButtonLink href="#" variant="secondary">
                Ver trabajos
              </ButtonLink>
              <ButtonLink href="#" variant="link">
                Ver obra
              </ButtonLink>
              <Button size="sm" arrow>
                Chico con flecha
              </Button>
              <Button variant="secondary" disabled>
                Deshabilitado
              </Button>
            </div>
            <div className="flex gap-4">
              <IconSquare icon={Handshake} />
              <IconSquare icon={HardHat} />
              <IconSquare icon={Ruler} size="sm" />
            </div>
          </Container>
        </Section>
      ))}

      <Section tone="light" spacing={false} className="border-y border-ink/16 py-6">
        <Marquee
          className="text-h4"
          items={[
            "Construcciones nuevas",
            "Reformas integrales",
            "Obras civiles",
            "Terminaciones exteriores",
            "Espacios deportivos",
            "Zárate y alrededores",
          ]}
        />
      </Section>

      <Section tone="light">
        <Container className="space-y-8">
          <Heading size="h3">Reveal</Heading>
          <div className="grid gap-6 md:grid-cols-3">
            {["01", "02", "03"].map((n, i) => (
              <Reveal key={n} delay={i * 0.08} className="border-t border-ink/16 pt-6">
                <p className="text-h3">{n}</p>
                <p className="mt-4 text-ink/64">Bloque con aparición al hacer scroll.</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>
      <GridLines />
    </main>
  );
}
