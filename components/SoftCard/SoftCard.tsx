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
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between gap-4">
            <h2 id={titleId} className="text-xl leading-tight font-semibold">
              {title}
            </h2>
            {action}
          </div>
          {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
