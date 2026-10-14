import { PostCard } from "@/components/site/post-card";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getPageContent, getPosts } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  const header = await getPageContent("blog.index");
  return pageMetadata({ title: "Blog", description: header?.subtitle, path: "/blog" });
}

export default async function BlogPage() {
  const [header, posts] = await Promise.all([getPageContent("blog.index"), getPosts()]);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Blog" }]}
        eyebrow={header?.eyebrow}
        title={header?.title ?? "Blog"}
        highlight={header?.highlight}
        subtitle={header?.subtitle}
      />
      <Section tone="light-2" aria-labelledby="listado-notas">
        <div className="container-site">
          <h2 id="listado-notas" className="sr-only">
            Notas
          </h2>
          {posts.length > 0 ? (
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="max-w-xl text-lead text-ink/64">
              Todavía no hay notas publicadas. Muy pronto vamos a compartir consejos y novedades de
              obra.
            </p>
          )}
        </div>
      </Section>
    </>
  );
}
