import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosted on a VPS behind Nginx + PM2.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Media uploads go one file per action call (max 10 MB each, see lib/media/process.ts).
    serverActions: { bodySizeLimit: "11mb" },
    // /admin/* runs through proxy.ts, which buffers request bodies.
    proxyClientMaxBodySize: "12mb",
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
