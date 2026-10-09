import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Express API origin (server-side only). Browser calls go to same-origin `/api/v1/*` and are
 * proxied here, so auth cookies are first-party on the site's domain (portfolio.md §6.3).
 */
const apiUrl = process.env.API_URL?.replace(/\/+$/, "");

/**
 * Content Security Policy (portfolio.md §12). Pages are static (no per-request nonce), so inline
 * scripts/styles from Next/React are allowed by 'unsafe-inline'; every *origin* is allow-listed:
 * Cloudinary (media + direct uploads), Google Identity (admin sign-in, visitor testimonials),
 * YouTube/Loom embeds, Google/GitHub avatars. Dev adds eval + websockets for hot reload.
 */
const buildCsp = (isDev: boolean) => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://accounts.google.com${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://avatars.githubusercontent.com https://i.ytimg.com",
  "font-src 'self' data:",
  `connect-src 'self' https://api.cloudinary.com https://accounts.google.com${isDev ? " ws: wss:" : ""}`,
  "media-src 'self' https://res.cloudinary.com",
  "frame-src https://accounts.google.com https://www.youtube-nocookie.com https://www.loom.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = (isDev: boolean) => [
  { key: "Content-Security-Policy", value: buildCsp(isDev) },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Google sign-in opens a popup that must be able to message this window back.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

/** `next dev` gets a relaxed CSP (eval + websockets for hot reload); builds get the strict one. */
const config = (phase: string): NextConfig => ({
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
    // Cloudinary resizes/formats every image (portfolio.md §7.4); see src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Google profile pictures (admin avatar) and Cloudinary media.
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async rewrites() {
    if (!apiUrl) return [];
    return [{ source: "/api/v1/:path*", destination: `${apiUrl}/api/v1/:path*` }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders(phase === PHASE_DEVELOPMENT_SERVER) },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
});

export default config;
