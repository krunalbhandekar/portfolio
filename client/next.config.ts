import type { NextConfig } from "next";

/**
 * Express API origin (server-side only). Browser calls go to same-origin `/api/v1/*` and are
 * proxied here, so auth cookies are first-party on the site's domain (portfolio.md §6.3).
 */
const apiUrl = process.env.API_URL?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Google profile pictures (admin avatar).
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
  async rewrites() {
    if (!apiUrl) return [];
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
