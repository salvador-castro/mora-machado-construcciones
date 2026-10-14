import type { Metadata } from "next";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import type { ListEntity } from "@/lib/admin/list-entities";
import { loadList } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Listas de inicio" };
export const instant = false;

const TABS: { entity: ListEntity; label: string; help: string }[] = [
  {
    entity: "highlight",
    label: "Highlights",
    help: "Los 3 destacados numerados debajo de la intro.",
  },
  {
    entity: "marqueeItem",
    label: "Marquee",
    help: "Textos que se desplazan en la franja de la intro.",
  },
  {
    entity: "processStep",
    label: "Proceso",
    help: "Pasos del slider «Proceso simple, obra ordenada».",
  },
  {
    entity: "valueItem",
    label: "Diferenciales",
    help: "Ítems con ícono de la sección de diferenciales.",
  },
];

export default async function ListsPage() {
  await requireUser();
  const data = await Promise.all(TABS.map((t) => loadList(t.entity)));

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="Listas de inicio"
        description="Arrastrá para reordenar. El interruptor oculta sin borrar."
      />
      <Tabs defaultValue={TABS[0].entity}>
        <TabsList className="mb-4 flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.entity} value={t.entity}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t, i) => (
          <TabsContent key={t.entity} value={t.entity} className="space-y-3">
            <p className="text-sm text-muted-foreground">{t.help}</p>
            <ListManager
              key={data[i].version}
              entity={t.entity}
              items={data[i].items}
              mediaPreviews={data[i].previews}
              defaults={data[i].defaults}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
