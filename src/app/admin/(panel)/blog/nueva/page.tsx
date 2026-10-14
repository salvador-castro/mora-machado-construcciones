import type { Metadata } from "next";
import { PostForm } from "@/components/admin/entities/post-form";
import { blogCategoryOptions } from "@/lib/admin/blog-options";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nueva nota" };
export const instant = false;

export default async function NewPostPage() {
  await requireUser();
  return (
    <PostForm
      id={null}
      categories={await blogCategoryOptions()}
      mediaPreviews={{}}
      initial={{
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        coverId: null,
        categoryId: null,
        status: "DRAFT",
        publishedAt: "",
        seoTitle: "",
        seoDescription: "",
      }}
    />
  );
}
