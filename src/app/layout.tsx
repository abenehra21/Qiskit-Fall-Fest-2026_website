import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * The absolute base every Open Graph, Twitter and canonical URL is resolved
 * against.
 *
 * The fallback used to be a placeholder domain, so unless NEXT_PUBLIC_APP_URL
 * was set in the deployment the share cards on WhatsApp, Discord and Twitter
 * pointed at qff2026.example.com — the registration link previewed as a site
 * nobody owns. Vercel injects the real hostname at build time, so the deploy
 * now describes itself correctly with nothing configured; setting
 * NEXT_PUBLIC_APP_URL still wins, and is what a custom domain needs.
 */
const vercelHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BITS Qiskit Fall Fest 2026 | QFF 2026",
    template: "%s | QFF 2026",
  },
  description:
    "BITS Qiskit Fall Fest 2026 (QFF 2026) — talks, workshops, and a 24-hour quantum computing hackathon at BITS Pilani.",
  keywords: [
    "Qiskit Fall Fest",
    "QFF 2026",
    "BITS Pilani",
    "quantum computing",
    "hackathon",
    "Qiskit",
  ],
  authors: [{ name: "BITS Qiskit Fall Fest" }],
  icons: {
    icon: "/image-removebg-preview.png",
    apple: "/image-removebg-preview.png",
  },
  openGraph: {
    title: "BITS Qiskit Fall Fest 2026",
    description:
      "A campus-wide gathering for quantum computing — talks, workshops, and a 24-hour hackathon at BITS Pilani.",
    url: siteUrl,
    siteName: "QFF 2026",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "BITS Qiskit Fall Fest 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BITS Qiskit Fall Fest 2026",
    description:
      "A campus-wide gathering for quantum computing — talks, workshops, and a 24-hour hackathon at BITS Pilani.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8fc",
  width: "device-width",
  initialScale: 1,
};

import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { SiteBackground } from "@/components/backgrounds/SiteBackground";
import { ContactDock } from "@/components/layout/ContactDock";
import { QffArtDefs } from "@/components/ui/qff-art";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {/* The fest artwork, defined once for the whole document. Scenes and
            in-page figures alike only ever emit a <use>. */}
        <QffArtDefs />
        <ThemeProvider attribute="class" defaultTheme="dark">
          <SiteBackground />
          {children}
          <ContactDock />
        </ThemeProvider>
      </body>
    </html>
  );
}
