import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import type { PostCardData } from "@/lib/content/queries";
import { formatDate } from "@/lib/format";

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="group relative flex flex-col">
      <div className="aspect-3/2 overflow-hidden bg-ink/8">
        {post.cover && (
          <MediaImage
            media={post.cover}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="size-full object-cover transition-transform duration-700 ease-soft group-hover:scale-[1.04] motion-reduce:transition-none"
          />
        )}
      </div>
      <p className="mt-5 flex gap-3 text-eyebrow text-ink/64">
        {post.category && <span>{post.category.name}</span>}
        {post.publishedAt && (
          <time dateTime={post.publishedAt.toISOString()}>{formatDate(post.publishedAt)}</time>
        )}
      </p>
      <h3 className="mt-3 text-h4">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 text-ink/64">{post.excerpt}</p>
    </article>
  );
}
