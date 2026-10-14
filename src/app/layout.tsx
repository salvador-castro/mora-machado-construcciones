import type { Metadata } from "next";
import { aspekta } from "@/fonts";
import { GridLines } from "@/components/ui/grid-lines";
import { getSettings } from "@/lib/content/queries";
import { accentVars } from "@/lib/color";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
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
        {children}
        <GridLines />
      </body>
    </html>
  );
}
