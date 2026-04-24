import { LoginForm } from "@/components/login/login-form";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { BrandHero } from "@/components/shared/brand-hero";
import { redirectIfAuthenticated } from "@/lib/auth/guards";
import { hasAuthConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <main className="app-shell">
      <ScrollReveal as="div" delay={20} distance="sm">
        <BrandHero
          subtitle="تسجيل دخول الإدارة"
          badge="PIN محمي"
        />
      </ScrollReveal>

      <ScrollReveal as="div" className="wrap login-wrap" delay={100}>
        <LoginForm authReady={hasAuthConfig()} />
      </ScrollReveal>
    </main>
  );
}
