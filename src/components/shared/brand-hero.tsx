import Image from "next/image";
import type { ReactNode } from "react";

type BrandHeroProps = {
  subtitle: string;
  badge?: string;
  actions?: ReactNode;
};

export function BrandHero({ subtitle, badge, actions }: BrandHeroProps) {
  return (
    <header className="header">
      {(badge || actions) && (
        <div className="header-topbar">
          {badge ? <span className="header-chip">{badge}</span> : <span />}
          {actions}
        </div>
      )}

      <div className="logo" aria-hidden="true">
        <div className="logo-badge">
          <Image
            src="/intro-logo.png"
            alt="شعار حسين بيرام"
            fill
            priority
            sizes="(max-width: 768px) 82vw, 320px"
          />
        </div>
      </div>

      <h1>حسين بيرام</h1>
      <p>{subtitle}</p>
    </header>
  );
}
