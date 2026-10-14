import { notFound } from "next/navigation";
import { CtaSection } from "@/components/home/cta-section";
import { PostCard } from "@/components/site/post-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MediaImage } from "@/components/ui/media-image";
import { RichText } from "@/components/ui/rich-text";
import { Section } from "@/components/ui/section";
import { getPageContent, getPostBySlug, getPostSlugs } from "@/lib/content/queries";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

// params are awaited before any Suspense so unknown slugs return a real 404 status.
// Known slugs are prerendered, so navigation is still instant in practice.
export const instant = false;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.cover,
    type: "article",
  });
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const [cta, details] = await Promise.all([getPageContent("home.cta"), getPageContent("details")]);

  return (
    <>
      <Section tone="light" spacing={false} className="pt-10 pb-12 lg:pt-14 lg:pb-16">
        <article className="container-site space-y-12">
          <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: post.title }]} />
          <header className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="flex justify-center gap-4 text-eyebrow text-ink/56">
              {post.category && <span>{post.category.name}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              )}
            </p>
            <h1 className="text-h2">{post.title}</h1>
            <p className="text-lead text-ink/72">{post.excerpt}</p>
          </header>
          {post.cover && (
            <div className="mx-auto aspect-video max-w-6xl overflow-hidden">
              <MediaImage
                media={post.cover}
                sizes="(min-width: 1280px) 1152px, 100vw"
                priority
                className="size-full object-cover"
              />
            </div>
          )}
          <RichText html={post.content} className="mx-auto" />
        </article>
      </Section>

      {post.related.length > 0 && (
        <Section tone="light-2" aria-labelledby="relacionadas">
          <div className="container-site space-y-12">
            <div className="space-y-5">
              <Eyebrow>Blog</Eyebrow>
              <h2 id="relacionadas" className="text-h2">
                {details?.blogRelatedTitle ?? "Blog"}
              </h2>
            </div>
            <div className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-8">
              {post.related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </Section>
      )}

      {cta && <CtaSection content={cta} testimonial={null} />}
    </>
  );
}
