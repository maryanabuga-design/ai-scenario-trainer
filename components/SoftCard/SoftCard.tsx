import { HeaderRow } from "@/components/HeaderRow/HeaderRow";
import type { ReactNode } from "react";

/** The Results surface card: warm near-white, 24px radius, a very soft shadow, no border. */
export function SoftCard({
  title,
  subtitle,
  action,
  titleId,
  className = "",
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  titleId?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={`flex flex-col gap-4 rounded-card bg-soft-card p-5 shadow-(--soft-shadow) ${className}`}
    >
      {title && (
        <HeaderRow
          title={
            <h2 id={titleId} className="type-card-title">
              {title}
            </h2>
          }
          action={action}
          subtitle={subtitle && <p className="type-small text-text-secondary">{subtitle}</p>}
        />
      )}
      {children}
    </section>
  );
}
