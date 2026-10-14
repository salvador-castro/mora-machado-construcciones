import localFont from "next/font/local";

// Aspekta — variable, SIL OFL 1.1 (see ./aspekta/OFL.txt). Source: github.com/ivodolenc/aspekta
export const aspekta = localFont({
  src: "./aspekta/AspektaVF.woff2",
  variable: "--font-aspekta",
  weight: "50 1000",
  display: "swap",
  fallback: ["Inter Tight", "Arial", "sans-serif"],
});
