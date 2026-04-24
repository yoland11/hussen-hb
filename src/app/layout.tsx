import type { Metadata } from "next";
import type { Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Noto_Kufi_Arabic } from "next/font/google";
import type { ReactNode } from "react";

import { AppIntroSplash } from "@/components/shared/app-intro-splash";
import { GenieScrollStage } from "@/components/shared/genie-scroll-stage";
import { PwaBootstrap } from "@/components/shared/pwa-bootstrap";

import "./globals.css";

const bodyFont = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Noto_Kufi_Arabic({
  variable: "--font-display",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "حسين بيرام | نظام إدارة الحجوزات",
  description:
    "نظام إدارة حجوزات جلسات تصوير أونلاين مبني باستخدام Next.js وSupabase وVercel.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "حسين بيرام",
  },
};

export const viewport: Viewport = {
  themeColor: "#003049",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${bodyFont.variable} ${displayFont.variable}`}
    >
      <body>
        <PwaBootstrap />
        <AppIntroSplash />
        <GenieScrollStage>{children}</GenieScrollStage>
      </body>
    </html>
  );
}
