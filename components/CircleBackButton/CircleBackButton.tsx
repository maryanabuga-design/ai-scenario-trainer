import { ArrowLeft } from "lucide-react";
import Link from "next/link";

/** A 44px white circle with an arrow, for the Results and Error analysis screens. */
export function CircleBackButton({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-text shadow-(--soft-shadow) active:bg-surface-muted"
    >
      <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}
