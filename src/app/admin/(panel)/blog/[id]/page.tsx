import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/entities/post-form";
import { blogCategoryOptions, toDayInput } from "@/lib/admin/blog-options";
import { mediaPreviews } from "@/lib/admin/media-previews";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Editar nota" };
export const instant = false;

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  await requireUser();
  const { id } = await params;
  const [p, categories] = await Promise.all([
    db.blogPost.findUnique({ where: { id } }),
    blogCategoryOptions(),
  ]);
  if (!p) notFound();

  return (
    <PostForm
      key={p.updatedAt.toISOString()}
      id={p.id}
      categories={categories}
      mediaPreviews={await mediaPreviews([p.coverId])}
      initial={{
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        coverId: p.coverId,
        categoryId: p.categoryId,
        status: p.status,
        publishedAt: toDayInput(p.publishedAt),
        seoTitle: p.seoTitle ?? "",
        seoDescription: p.seoDescription ?? "",
      }}
    />
  );
}
