import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { RichText } from "@/components/ui/rich-text";
import { Section } from "@/components/ui/section";
import { getPageContent } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const page = await getPageContent("legal.privacy");
  return pageMetadata({ title: page?.title ?? "Privacidad", path: "/legales/privacidad" });
}

export default async function PrivacyPage() {
  const page = await getPageContent("legal.privacy");
  if (!page) notFound();

  return (
    <Section tone="light" spacing={false} className="pt-10 pb-24 lg:pt-14 lg:pb-32">
      <div className="container-site space-y-12">
        <Breadcrumbs items={[{ label: "Legales" }, { label: page.title }]} />
        <div className="grid gap-10 lg:grid-cols-12">
          <header className="space-y-4 lg:col-span-4">
            <h1 className="text-h2">{page.title}</h1>
            <p className="text-sm text-ink/64">Última actualización: {page.lastUpdated}</p>
          </header>
          <RichText html={page.body} className="lg:col-span-7 lg:col-start-6" />
        </div>
      </div>
    </Section>
  );
}
