import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  icon: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  icon,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`card ${className}`.trim()}>
      <div className="ctitle">
        <div className="cicon">{icon}</div>
        {title}
      </div>
      {children}
    </section>
  );
}
