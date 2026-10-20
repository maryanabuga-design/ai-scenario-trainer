import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** The three locked button types (DESIGN.md: Buttons). */
export type ButtonVariant = "primary" | "secondary" | "tertiary";

export type ButtonLook = {
  variant?: ButtonVariant;
  /** Primary and secondary fill the width by default; false for one in a row (Ask AI Send, the
   * Materials header). */
  wide?: boolean;
  /** The small primary pill of a Training row (Start, Continue): 36px high, 12px radius. */
  pill?: boolean;
  /** 16px instead of 24px side padding, so the Results pair can fit on one line. */
  snug?: boolean;
  /** 44px high instead of 52px: only the Materials page-header action. */
  compact?: boolean;
  /** A decorative icon before the label (the sparkle for AI actions). */
  icon?: LucideIcon;
  /** Decorative content after the label, outside its underline (the arrow of "Details"). */
  trailing?: ReactNode;
};

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "type-button h-[52px] bg-primary text-primary-text active:bg-primary-pressed disabled:border disabled:border-secondary-sand-pressed disabled:bg-secondary-sand disabled:text-text-secondary",
  // Filled with the light olive tint and no stroke, so it is exactly as big as the primary.
  secondary:
    "type-button h-[52px] bg-olive-tint text-primary active:bg-olive-tint-pressed disabled:bg-secondary-sand disabled:text-text-secondary",
  // Small underlined text; the 44px tap area is invisible padding, never a visible box.
  tertiary: "type-action text-primary min-h-11 px-3 disabled:text-text-secondary",
};

/** The pressed look without pressing, for the screen review page only. */
export const pressedLook: Record<ButtonVariant, string> = {
  primary: "bg-primary-pressed",
  secondary: "bg-olive-tint-pressed",
  tertiary: "[&>span]:decoration-2",
};

/** The page-header action (Upload a file) is 44px high instead of 52px. */
const compactHeight = "h-11!";

export function buttonClasses({ variant = "primary", wide, compact, snug, pill }: ButtonLook) {
  const width = (wide ?? variant !== "tertiary") ? "w-full" : "";
  const padding = variant === "tertiary" ? "" : snug || pill ? "px-4" : "px-6";
  return `group inline-flex items-center justify-center gap-2 rounded-button disabled:cursor-not-allowed ${buttonVariants[variant]} ${padding} ${width} ${compact ? compactHeight : ""} ${pill ? "h-9! rounded-xl!" : ""}`;
}

function Content({
  variant = "primary",
  icon: Icon,
  trailing,
  children,
}: ButtonLook & { children: ReactNode }) {
  const label =
    variant === "tertiary" ? (
      <span className="underline decoration-1 underline-offset-4 group-active:decoration-2 group-disabled:no-underline">
        {children}
      </span>
    ) : (
      children
    );
  return (
    <>
      {Icon && <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
      {label}
      {trailing}
    </>
  );
}

export function Button({
  variant = "primary",
  wide,
  compact,
  snug,
  icon,
  trailing,
  children,
  ...props
}: Omit<ComponentProps<"button">, "className"> & ButtonLook) {
  return (
    <button type="button" className={buttonClasses({ variant, wide, compact, snug })} {...props}>
      <Content variant={variant} icon={icon} trailing={trailing}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  wide,
  compact,
  snug,
  icon,
  trailing,
  onClick,
  download,
  children,
}: ButtonLook & {
  href: string;
  onClick?: () => void;
  /** A file to save (a plain link, not a page change): the name it is saved under. */
  download?: string;
  children: ReactNode;
}) {
  const content = (
    <Content variant={variant} icon={icon} trailing={trailing}>
      {children}
    </Content>
  );
  const className = buttonClasses({ variant, wide, compact, snug });
  return download ? (
    <a href={href} download={download} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}

/**
 * A still picture of a button in one state, for the screen review page only: pressed and focus
 * cannot be held on a real button.
 */
export function ButtonPreview({
  variant = "primary",
  state,
  icon,
  children,
}: {
  variant?: ButtonVariant;
  state: "default" | "pressed" | "disabled" | "focus";
  icon?: LucideIcon;
  children: ReactNode;
}) {
  const look =
    state === "pressed"
      ? pressedLook[variant]
      : state === "focus"
        ? "outline-2 outline-offset-2 outline-accent"
        : "";
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      disabled={state === "disabled"}
      className={`${buttonClasses({ variant })} ${look}`}
    >
      <Content variant={variant} icon={icon}>
        {children}
      </Content>
    </button>
  );
}

/**
 * The square icon button of the question screen's bottom bar (the hint button): the secondary's
 * olive-tint fill with no stroke, 52 by 52px, the 14px radius, an icon and no text. The one
 * allowed exception to "only a primary in the bottom bar" (DESIGN.md: Buttons).
 */
export function SquareButton({
  icon: Icon,
  label,
  expanded,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  /** The accessible name: the button has no visible text. */
  label: string;
  /** Whether the thing it opens is open. */
  expanded?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      disabled={disabled}
      onClick={onClick}
      className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-button bg-olive-tint text-primary active:bg-olive-tint-pressed disabled:cursor-not-allowed disabled:bg-secondary-sand disabled:text-text-secondary"
    >
      <Icon size={24} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
