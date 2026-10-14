import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PostsTable } from "@/components/admin/entities/posts-table";
import { ListManager } from "@/components/admin/lists/list-manager";
import { PageTitle } from "@/components/admin/page-title";
import { Button } from "@/components/admin/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { loadList } from "@/lib/admin/list-loader";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Blog" };
export const instant = false;

export default async function BlogPage({ searchParams }: PageProps<"/admin/blog">) {
  await requireUser();
  const { tab } = await searchParams;
  const [posts, categories] = await Promise.all([
    db.blogPost.findMany({
      orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    }),
    loadList("blogCategory"),
  ]);
  const rows = posts.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    category: p.category?.name ?? null,
    author: p.author?.name ?? null,
    date: (p.publishedAt ?? p.updatedAt).toLocaleDateString("es-AR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Argentina/Buenos_Aires",
    }),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Blog"
        description="Notas y novedades. Los borradores no se ven en el sitio."
        actions={
          <Button asChild>
            <Link href="/admin/blog/nueva">
              <Plus /> Nueva nota
            </Link>
          </Button>
        }
      />
      <Tabs defaultValue={tab === "categorias" ? "categorias" : "notas"}>
        <TabsList className="mb-4">
          <TabsTrigger value="notas">Notas ({rows.length})</TabsTrigger>
          <TabsTrigger value="categorias">Categorías ({categories.items.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="notas">
          <PostsTable rows={rows} />
        </TabsContent>
        <TabsContent value="categorias">
          <ListManager
            key={categories.version}
            entity="blogCategory"
            items={categories.items}
            mediaPreviews={categories.previews}
            defaults={categories.defaults}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
