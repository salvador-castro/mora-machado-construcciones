import type { Metadata } from "next";
import { aspekta } from "@/fonts";
import { getSettings } from "@/lib/content/queries";
import { accentVars } from "@/lib/color";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  // Changes whenever the favicon, the brand or the accent color change.
  const v = encodeURIComponent(
    settings.favicon?.id ?? `${settings.brandName}-${settings.accentColor}`,
  ).slice(0, 80);
  return {
    icons: {
      icon: [
        { url: `/site-icon?s=32&v=${v}`, sizes: "32x32", type: "image/png" },
        { url: `/site-icon?s=192&v=${v}`, sizes: "192x192", type: "image/png" },
      ],
      apple: { url: `/site-icon?s=180&v=${v}`, sizes: "180x180", type: "image/png" },
    },
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: settings.defaultSeoTitle, template: `%s | ${settings.brandName}` },
    description: settings.defaultSeoDescription,
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${aspekta.variable} h-full antialiased`}
      style={accentVars(settings.accentColor)}
    >
      <body className="flex min-h-full flex-col">
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;translate:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
