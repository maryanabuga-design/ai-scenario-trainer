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
  /** 44px high instead of 52px: only the Materials page-header action. */
  compact?: boolean;
  /** A decorative icon before the label (the sparkle for AI actions). */
  icon?: LucideIcon;
  /** Decorative content after the label, outside its underline (the arrow of "Details"). */
  trailing?: ReactNode;
};

export const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "type-button h-[52px] px-6 bg-primary text-primary-text active:bg-primary-pressed disabled:border disabled:border-secondary-sand-pressed disabled:bg-secondary-sand disabled:text-text-secondary",
  // Filled with the light olive tint and no stroke, so it is exactly as big as the primary.
  secondary:
    "type-button h-[52px] px-6 bg-olive-tint text-primary active:bg-olive-tint-pressed disabled:bg-secondary-sand disabled:text-text-secondary",
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

export function buttonClasses({ variant = "primary", wide, compact }: ButtonLook) {
  const width = (wide ?? variant !== "tertiary") ? "w-full" : "";
  return `group inline-flex items-center justify-center gap-2 rounded-button disabled:cursor-not-allowed ${buttonVariants[variant]} ${width} ${compact ? compactHeight : ""}`;
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
  icon,
  trailing,
  children,
  ...props
}: Omit<ComponentProps<"button">, "className"> & ButtonLook) {
  return (
    <button type="button" className={buttonClasses({ variant, wide, compact })} {...props}>
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
  icon,
  trailing,
  onClick,
  children,
}: ButtonLook & { href: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className={buttonClasses({ variant, wide, compact })}>
      <Content variant={variant} icon={icon} trailing={trailing}>
        {children}
      </Content>
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
