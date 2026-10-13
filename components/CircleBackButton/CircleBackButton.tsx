import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const circle =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-neutral-surface";

/**
 * The one back button: a 44px white circle with a dark arrow, top left, no visible text. Its
 * accessible name names the destination ("Back to materials"). A link, or a button for a back
 * step that runs code (Generating cancels).
 */
export function CircleBackButton(
  props: { label: string } & ({ href: string; onClick?: () => void } | { onClick: () => void }),
) {
  const icon = <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />;
  if ("href" in props) {
    return (
      <Link href={props.href} aria-label={props.label} onClick={props.onClick} className={circle}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={props.label} onClick={props.onClick} className={circle}>
      {icon}
    </button>
  );
}
