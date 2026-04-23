import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.husseinbairam.bookings",
  appName: "حسين بيرام",
  webDir: "android-web",
  server: {
    url: "https://hussein-bairam.vercel.app",
    cleartext: false,
    allowNavigation: ["hussein-bairam.vercel.app"],
  },
};

export default config;
