import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AnnouncementBar({ text, url }: { text: string; url?: string | null }) {
  const content = (
    <>
      <span>{text}</span>
      {url && <ArrowRight aria-hidden className="size-3.5" />}
    </>
  );
  return (
    <div className="border-b border-paper/16 tone-dark text-[13px]">
      <div className="container-site flex min-h-9 items-center justify-center py-2 text-center">
        {url ? (
          <Link href={url} className="inline-flex items-center gap-2 hover:underline">
            {content}
          </Link>
        ) : (
          <p className="inline-flex items-center gap-2">{content}</p>
        )}
      </div>
    </div>
  );
}
