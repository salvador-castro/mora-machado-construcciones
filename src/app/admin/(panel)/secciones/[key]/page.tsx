import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { PageTitle } from "@/components/admin/page-title";
import { SectionForm } from "@/components/admin/sections/section-form";
import { Button } from "@/components/admin/ui/button";
import { HOME_SECTION_KEYS, SECTION_PREVIEW, SECTION_RELATED } from "@/lib/admin/sections";
import { requireUser } from "@/lib/auth/session";
import { mediaFields } from "@/lib/content/form-meta";
import { pageContentLabels, pageContentSchemas, type PageContentKey } from "@/lib/content/schemas";
import { db } from "@/lib/db";
import { getMediaItems } from "@/server/actions/media";

export const instant = false;

function isKey(key: string): key is PageContentKey {
  return Object.hasOwn(pageContentSchemas, key);
}

export async function generateMetadata({
  params,
}: PageProps<"/admin/secciones/[key]">): Promise<Metadata> {
  const { key } = await params;
  return { title: isKey(key) ? pageContentLabels[key] : "Sección" };
}

export default async function SectionEditPage({ params }: PageProps<"/admin/secciones/[key]">) {
  await requireUser();
  const { key } = await params;
  if (!isKey(key)) notFound();

  const row = await db.pageContent.findUnique({ where: { key } });
  const data = (row?.data ?? {}) as Record<string, unknown>;
  const mediaIds = mediaFields(pageContentSchemas[key])
    .map((f) => data[f])
    .filter((v): v is string => typeof v === "string");
  const previews = Object.fromEntries((await getMediaItems(mediaIds)).map((m) => [m.id, m]));
  const isHome = HOME_SECTION_KEYS.includes(key);
  const related = SECTION_RELATED[key] ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
        <Link href={isHome ? "/admin/secciones" : "/admin/paginas"}>
          <ArrowLeft />
          {isHome ? "Secciones" : "Páginas"}
        </Link>
      </Button>
      <PageTitle title={pageContentLabels[key]} />
      {related.length > 0 && (
        <p className="-mt-4 mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          También se edita en:
          {related.map((r) => (
            <Link
              key={r.href + r.label}
              href={r.href}
              className="inline-flex items-center gap-0.5 text-foreground underline-offset-2 hover:underline"
            >
              {r.label}
              <ArrowUpRight className="size-3" />
            </Link>
          ))}
        </p>
      )}
      <SectionForm
        key={row?.updatedAt.toISOString() ?? "new"}
        contentKey={key}
        initialData={data}
        published={row?.published ?? true}
        previewHref={SECTION_PREVIEW[key]}
        mediaPreviews={previews}
      />
    </div>
  );
}
