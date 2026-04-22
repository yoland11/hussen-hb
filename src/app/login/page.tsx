import { LoginForm } from "@/components/login/login-form";
import { BrandHero } from "@/components/shared/brand-hero";
import { redirectIfAuthenticated } from "@/lib/auth/guards";
import { hasAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="app-shell">
      <BrandHero
        subtitle="تسجيل دخول الإدارة"
        badge="PIN محمي"
      />

      <div className="wrap login-wrap">
        <LoginForm authReady={hasAuthConfig()} />
      </div>
    </main>
  );
}
