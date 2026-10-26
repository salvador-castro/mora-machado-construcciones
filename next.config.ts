import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isHttps = (process.env.SITE_URL ?? "").startsWith("https://");
const TURNSTILE = "https://challenges.cloudflare.com";

// No nonces: pages are prerendered (Cache Components), so inline scripts need
// 'unsafe-inline'. The policy still blocks third-party scripts, plugins,
// framing, <base> hijacking and off-site form posts.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${TURNSTILE}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // Uploaded videos (/uploads/*.mp4) and the admin's local preview before uploading.
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  // Google Maps embed (Settings → mapa) and the Turnstile widget.
  `frame-src https://www.google.com https://maps.google.com ${TURNSTILE}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isHttps && !isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Nginx must not buffer: streaming (Suspense / partial prerendering) needs chunked responses.
  { key: "X-Accel-Buffering", value: "no" },
  ...(isHttps && !isDev
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Self-hosted on a VPS behind Nginx + PM2.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // The legacy static site was a single index.html (may still be indexed/linked).
    return [{ source: "/index.html", destination: "/", permanent: true }];
  },
  experimental: {
    // Media uploads go one file per action call (images up to 10 MB, videos up to
    // 30 MB: see lib/media/process.ts).
    serverActions: { bodySizeLimit: "31mb" },
    // /admin/* runs through proxy.ts, which buffers request bodies.
    proxyClientMaxBodySize: "32mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
