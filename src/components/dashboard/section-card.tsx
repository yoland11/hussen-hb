import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/shared/scroll-reveal";

type SectionCardProps = {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
  revealDelay?: number;
};

export function SectionCard({
  title,
  icon,
  children,
  className = "",
  revealDelay = 0,
}: SectionCardProps) {
  return (
    <ScrollReveal
      as="section"
      className={`card ${className}`.trim()}
      delay={revealDelay}
    >
      <div className="ctitle">
        <div className="cicon">{icon}</div>
        {title}
      </div>
      {children}
    </ScrollReveal>
  );
}
