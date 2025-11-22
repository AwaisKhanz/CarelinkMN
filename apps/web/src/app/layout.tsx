import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CareLinkMN - Minnesota Care Coordination Platform",
  description:
    "Connect families, case managers, and care providers through intelligent, payer-aware search with real-time availability tracking.",
  keywords: [
    "Minnesota",
    "care coordination",
    "healthcare",
    "providers",
    "case management",
  ],
  authors: [{ name: "CareLinkMN Team" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://carelinkmn.com",
    title: "CareLinkMN - Minnesota Care Coordination Platform",
    description:
      "Connect families, case managers, and care providers through intelligent, payer-aware search with real-time availability tracking.",
    siteName: "CareLinkMN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareLinkMN - Minnesota Care Coordination Platform",
    description:
      "Connect families, case managers, and care providers through intelligent, payer-aware search with real-time availability tracking.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
