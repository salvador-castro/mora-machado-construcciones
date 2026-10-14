import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { LeadEmailStatus } from "@/components/admin/leads/email-status";
import { LeadManager } from "@/components/admin/leads/lead-manager";
import { Button } from "@/components/admin/ui/button";
import { timeAgo } from "@/lib/admin/labels";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { telHref, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Consulta" };
export const instant = false;

export default async function LeadPage({ params }: PageProps<"/admin/consultas/[id]">) {
  await requireUser();
  const { id } = await params;
  const [lead, settings] = await Promise.all([
    db.lead.findUnique({ where: { id } }),
    db.siteSettings.findUnique({ where: { id: 1 }, select: { brandName: true } }),
  ]);
  if (!lead) notFound();

  const firstName = lead.name.split(/\s+/)[0];
  const received = lead.createdAt.toLocaleString("es-AR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const details: [string, React.ReactNode][] = [
    ["Teléfono", lead.phone],
    ["Email", lead.email],
    ["Presupuesto", lead.budgetRange],
    ["Enviada desde", lead.sourcePage],
    ["Recibida", `${received} (${timeAgo(lead.createdAt)})`],
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link href="/admin/consultas">
          <ArrowLeft />
          Consultas
        </Link>
      </Button>
      <h1 className="mb-6 text-2xl font-medium tracking-tight lg:mb-8">{lead.name}</h1>

      <div className="space-y-6">
        <section className="space-y-5 rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a
                href={whatsappUrl(
                  lead.phone,
                  `Hola ${firstName}, te escribo de ${settings?.brandName ?? "la empresa"} por tu consulta.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle /> Responder por WhatsApp
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={telHref(lead.phone)}>
                <Phone /> Llamar
              </a>
            </Button>
            {lead.email && (
              <Button variant="outline" asChild>
                <a href={`mailto:${lead.email}?subject=${encodeURIComponent("Tu consulta")}`}>
                  <Mail /> Email
                </a>
              </Button>
            )}
          </div>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[max-content_1fr]">
            {details
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ))}
          </dl>
          <LeadEmailStatus id={lead.id} status={lead.emailStatus} info={lead.emailInfo} />
          <div>
            <h2 className="mb-2 text-sm text-muted-foreground">Mensaje</h2>
            <p className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">{lead.message}</p>
          </div>
        </section>

        <LeadManager
          key={lead.updatedAt.toISOString()}
          id={lead.id}
          status={lead.status}
          notes={lead.notes ?? ""}
        />
      </div>
    </div>
  );
}
