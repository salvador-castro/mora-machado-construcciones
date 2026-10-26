import type { Metadata } from "next";
import { PageTitle } from "@/components/admin/page-title";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { requireUser } from "@/lib/auth/session";
import {
  phonesSchema,
  socialsSchema,
  todosSchema,
  type SettingsInput,
} from "@/lib/content/schemas";
import { db } from "@/lib/db";
import { getMediaItems } from "@/server/actions/media";

export const metadata: Metadata = { title: "Configuración" };
export const instant = false;

export default async function SettingsPage() {
  await requireUser();
  const s = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } });

  const initial: SettingsInput = {
    brandName: s.brandName,
    tagline: s.tagline,
    logoId: s.logoId,
    faviconId: s.faviconId,
    accentColor: s.accentColor,
    phones: phonesSchema.catch([]).parse(s.phones),
    email: s.email ?? "",
    address: s.address ?? "",
    coverage: s.coverage ?? "",
    openingHours: s.openingHours ?? "",
    mapEmbedUrl: s.mapEmbedUrl ?? "",
    socials: socialsSchema.catch([]).parse(s.socials),
    announcementText: s.announcementText ?? "",
    announcementUrl: s.announcementUrl ?? "",
    announcementEnabled: s.announcementEnabled,
    footerText: s.footerText ?? "",
    whatsappMessage: s.whatsappMessage,
    defaultSeoTitle: s.defaultSeoTitle,
    defaultSeoDescription: s.defaultSeoDescription,
    defaultOgImageId: s.defaultOgImageId,
    notificationEmails: s.notificationEmails,
    budgetRanges: s.budgetRanges,
    pendingTodos: todosSchema.catch([]).parse(s.pendingTodos),
  };
  const ids = [s.logoId, s.faviconId, s.defaultOgImageId].filter((v): v is string => !!v);
  const previews = Object.fromEntries((await getMediaItems(ids)).map((m) => [m.id, m]));

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Configuración"
        description="Datos de la empresa, contacto, colores y SEO."
      />
      <SettingsForm key={s.updatedAt.toISOString()} initial={initial} mediaPreviews={previews} />
    </div>
  );
}
