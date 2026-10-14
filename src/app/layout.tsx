import type { Metadata } from "next";
import { aspekta } from "@/fonts";
import { GridLines } from "@/components/ui/grid-lines";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mora Machado Construcciones",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${aspekta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <GridLines />
      </body>
    </html>
  );
}
