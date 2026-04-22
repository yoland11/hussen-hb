import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const isAuthenticated = await hasAdminSession();

  redirect(isAuthenticated ? "/dashboard" : "/login");
}
