import { sanitizeRichText } from "@/lib/sanitize";
import { cn } from "@/lib/cn";

/** Renders admin-authored HTML after sanitizing it. Styles: `.rich-text` in globals.css. */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html.trim()) return null;
  return (
    <div
      className={cn("rich-text", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
