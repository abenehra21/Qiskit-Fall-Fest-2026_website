import type { NextConfig } from "next";

/**
 * Security response headers.
 *
 * On the Content-Security-Policy below: `script-src` carries 'unsafe-inline'
 * because Next.js emits inline bootstrap and hydration scripts, and next-themes
 * inlines a script to set the theme before first paint. Removing it requires a
 * per-request nonce, which per Next's own CSP guide forces dynamic rendering on
 * every page — this site is entirely statically prerendered, so that would
 * trade all of its caching for protection against an injection sink the
 * codebase does not currently have (no dangerouslySetInnerHTML, no innerHTML,
 * no eval anywhere). If an organiser dashboard ever renders attendee-supplied
 * content, revisit this and move the policy to a nonce in proxy.ts.
 *
 * 'strict-dynamic' is deliberately absent: it makes browsers ignore
 * 'unsafe-inline' and the host allowlist, which would break the page rather
 * than harden it.
 *
 * The directives that carry real weight here are frame-ancestors (the
 * registration form could otherwise be framed for clickjacking), form-action,
 * base-uri and object-src.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt and braces for frame-ancestors, for anything that predates CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    // Two years, subdomains included, preload-eligible. Vercel serves HTTPS
    // only, so there is no plaintext origin for this to lock users out of.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Stop advertising the framework and version to scanners.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Registrant data must never be held by a shared cache.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
