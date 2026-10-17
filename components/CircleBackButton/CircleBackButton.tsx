import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const circle =
  "flex shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-surface-muted";
const sizes = { small: "h-10 w-10", regular: "h-11 w-11" } as const;

/** The look of a white circular icon button, shared by the reading header's arrows. */
export const circleLook = (size: keyof typeof sizes = "regular") => `${circle} ${sizes[size]}`;

/**
 * The one back button: a 44px white circle (40px with `size="small"`, for the session's top row) with a dark arrow, top left, no visible text. Its
 * accessible name names the destination ("Back to materials"). A link, or a button for a back
 * step that runs code (Generating cancels).
 */
export function CircleBackButton(
  props: { label: string; size?: keyof typeof sizes } & (
    { href: string; onClick?: () => void } | { onClick: () => void }
  ),
) {
  const look = `${circle} ${sizes[props.size ?? "regular"]}`;
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
