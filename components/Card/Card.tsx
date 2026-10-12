import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card bg-card p-4 shadow-(--card-shadow) ${className}`}>{children}</div>
  );
}
