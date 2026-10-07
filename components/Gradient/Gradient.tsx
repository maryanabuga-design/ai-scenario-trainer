import type { ReactNode } from "react";

type Tone = "warm" | "cool";

/** Soft gradient zone. Use only where DESIGN.md allows gradients, never behind body text. */
export function Gradient({
  tone = "warm",
  className = "",
  children,
}: {
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}) {
  return <div className={`gradient-${tone} ${className}`}>{children}</div>;
}
