import Link from "next/link";
import { MediaImage } from "@/components/ui/media-image";
import type { MediaAsset } from "@/lib/media/types";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Logo from the media library, or a typographic monogram until one is uploaded. */
export function BrandMark({
  brandName,
  tagline,
  logo,
  className,
  showTagline = false,
}: {
  brandName: string;
  tagline?: string | null;
  logo: MediaAsset | null;
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      {logo ? (
        <MediaImage
          media={logo}
          alt={brandName}
          sizes="160px"
          className="h-8 w-auto bg-transparent"
        />
      ) : (
        <>
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center bg-accent text-sm font-semibold tracking-tight text-accent-fg"
          >
            {initials(brandName)}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-medium tracking-tight">{brandName}</span>
            {showTagline && tagline && <span className="text-xs text-current/88">{tagline}</span>}
          </span>
        </>
      )}
    </Link>
  );
}
