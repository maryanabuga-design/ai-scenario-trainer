import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const circle =
  "flex shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-surface-muted";
const sizes = { regular: "h-11 w-11", large: "h-12 w-12" } as const;

/**
 * The one back button: a 44px white circle (48px with `large`, for the session's bottom bar) with a dark arrow, top left, no visible text. Its
 * accessible name names the destination ("Back to materials"). A link, or a button for a back
 * step that runs code (Generating cancels).
 */
export function CircleBackButton(
  props: { label: string; large?: boolean } & (
    { href: string; onClick?: () => void } | { onClick: () => void }
  ),
) {
  const look = `${circle} ${props.large ? sizes.large : sizes.regular}`;
  const icon = <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />;
  if ("href" in props) {
    return (
      <Link href={props.href} aria-label={props.label} onClick={props.onClick} className={look}>
        {icon}
      </Link>
    );
  }
  return (
    <button type="button" aria-label={props.label} onClick={props.onClick} className={look}>
      {icon}
    </button>
  );
}
