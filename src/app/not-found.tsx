import type { Metadata } from "next";
import { SiteChrome } from "@/components/site/site-chrome";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

/** Unmatched URLs (outside any route group) — rendered with the full site chrome. */
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
