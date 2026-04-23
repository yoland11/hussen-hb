import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "حسين بيرام",
    short_name: "حسين بيرام",
    description: "نظام إدارة حجوزات جلسات تصوير أونلاين",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#003049",
    theme_color: "#003049",
    lang: "ar",
    dir: "rtl",
    icons: [
      {
        src: "/hb-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/hb-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/hb-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
