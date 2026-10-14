import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaSection } from "@/components/home/cta-section";
import { GalleryGrid } from "@/components/home/gallery-grid";
import { ProjectCard } from "@/components/home/project-card";
import { Eyebrow } from "@/components/ui/eyebrow";
import { MediaImage } from "@/components/ui/media-image";
import { PageHeader } from "@/components/ui/page-header";
import { Reveal } from "@/components/ui/reveal";
import { RichText } from "@/components/ui/rich-text";
import { Section } from "@/components/ui/section";
import {
  getFeaturedTestimonial,
  getPageContent,
  getProjectBySlug,
  getProjectSlugs,
} from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

// params are awaited before any Suspense so unknown slugs return a real 404 status.
// Known slugs are prerendered, so navigation is still instant in practice.
export const instant = false;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/obras/[slug]">) {
  const { slug } = await params;
  const p = await getProjectBySlug(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.excerpt,
    path: `/obras/${p.slug}`,
    image: p.cover,
  });
}

export default async function ProjectPage({ params }: PageProps<"/obras/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [cta, featuredTestimonial, details] = await Promise.all([
    getPageContent("home.cta"),
    getFeaturedTestimonial(),
    getPageContent("details"),
  ]);

  const meta = [
    { label: "Ubicación", value: project.location },
    project.service && {
      label: "Servicio",
      value: (
        <Link
          href={`/servicios/${project.service.slug}`}
          className="underline-offset-4 hover:underline"
        >
          {project.service.title}
        </Link>
      ),
    },
    { label: "Categoría", value: project.category.name },
    project.year && { label: "Año", value: String(project.year) },
    project.area && { label: "Superficie", value: project.area },
  ].filter(Boolean) as { label: string; value: React.ReactNode }[];

  // The cover already heads the page; don't repeat it in the gallery.
  const gallery = project.images
    .filter((img) => img.media.id !== project.cover?.id)
    .map((img) => ({ ...img, shape: "normal" as const }));
  const hasContent = project.content.replace(/<[^>]+>/g, "").trim() !== project.excerpt.trim();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Obras", href: "/obras" }, { label: project.title }]}
        eyebrow={project.category.name}
        title={project.title}
        subtitle={project.excerpt}
      >
        <dl className="grid grid-cols-2 gap-6 border-t border-ink/16 pt-6 md:grid-cols-3 lg:grid-cols-5">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="text-eyebrow text-ink/48">{m.label}</dt>
              <dd className="mt-1">{m.value}</dd>
            </div>
          ))}
        </dl>
        {project.cover && (
          <div className="overflow-hidden">
            <MediaImage
              media={project.cover}
              sizes="100vw"
              priority
              className="max-h-[80svh] w-full object-cover"
            />
          </div>
        )}
      </PageHeader>

      {hasContent && (
        <Section tone="light-2">
          <div className="container-site grid lg:grid-cols-12">
            <Reveal className="lg:col-span-8 lg:col-start-3">
              <RichText html={project.content} />
            </Reveal>
          </div>
        </Section>
      )}

      {gallery.length > 0 && (
        <Section tone="light" aria-labelledby="galeria-obra">
          <div className="container-site space-y-12">
            <div className="space-y-5">
              <Eyebrow>Galería</Eyebrow>
              <h2 id="galeria-obra" className="text-h2">
                {details?.projectGalleryTitle ?? project.title}
              </h2>
            </div>
            <GalleryGrid items={gallery} />
          </div>
        </Section>
      )}

      {project.testimonial && (
        <Section tone="sand">
          <div className="container-site grid lg:grid-cols-12">
            <figure className="space-y-8 lg:col-span-9">
              <blockquote className="text-h3">“{project.testimonial.quote}”</blockquote>
              <figcaption>
                <p className="font-medium">{project.testimonial.author}</p>
                {project.testimonial.role && (
                  <p className="text-sm text-ink/64">{project.testimonial.role}</p>
                )}
              </figcaption>
            </figure>
          </div>
        </Section>
      )}

      {project.related.length > 0 && (
        <Section tone="light-2" aria-labelledby="otras-obras">
          <div className="container-site space-y-12">
            <div className="space-y-5">
              <Eyebrow>Obras</Eyebrow>
              <h2 id="otras-obras" className="text-h2">
                {details?.projectRelatedTitle ?? "Obras"}
              </h2>
            </div>
            <div className="grid gap-x-6 gap-y-16 md:grid-cols-2 lg:gap-x-8">
              {project.related.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        </Section>
      )}

      {cta && (
        <CtaSection content={cta} testimonial={project.testimonial ? null : featuredTestimonial} />
      )}
    </>
  );
}
