import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/** The three locked button types (DESIGN.md: Buttons). */
export type ButtonVariant = "primary" | "secondary" | "text";

export type ButtonLook = {
  variant?: ButtonVariant;
  /** Filled buttons fill the width by default; false for one in a row (Ask AI Send). */
  wide?: boolean;
  /** Text buttons only: the small text size, inside the answer dock. */
  small?: boolean;
  /** A decorative icon before the label (the sparkle for AI actions). */
  icon?: LucideIcon;
  /** A decorative icon after the label (the arrow of "Details"). */
  iconEnd?: LucideIcon;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "type-button min-h-12 px-6 bg-primary text-primary-text active:bg-primary-pressed disabled:bg-secondary-olive disabled:text-text-secondary",
  secondary:
    "type-button min-h-11 px-5 border-[1.5px] border-primary bg-transparent text-primary active:bg-secondary-olive disabled:border-secondary-olive-pressed disabled:bg-transparent disabled:text-text-secondary",
  text: "min-h-11 px-3 text-primary active:bg-secondary-olive disabled:bg-transparent disabled:text-text-secondary",
};

/** The pressed look without pressing, for the screen review page only. */
export const pressedLook: Record<ButtonVariant, string> = {
  primary: "bg-primary-pressed",
  secondary: "bg-secondary-olive",
  text: "bg-secondary-olive",
};

export function buttonClasses({ variant = "primary", wide, small }: ButtonLook) {
  const width = (wide ?? variant === "primary") ? "w-full" : "";
  const size = variant === "text" ? (small ? "type-small" : "type-body") : "";
  return `group inline-flex items-center justify-center gap-2 rounded-full disabled:cursor-not-allowed ${variants[variant]} ${size} ${width}`;
}

function Content({
  variant = "primary",
  icon: Icon,
  iconEnd: IconEnd,
  children,
}: ButtonLook & { children: ReactNode }) {
  const label =
    variant === "text" ? (
      <span className="underline decoration-1 underline-offset-4 group-disabled:no-underline">
        {children}
      </span>
    ) : (
      children
    );
  return (
    <>
      {Icon && <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
      {label}
      {IconEnd && <IconEnd size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />}
    </>
  );
}

export function Button({
  variant = "primary",
  wide,
  small,
  icon,
  iconEnd,
  children,
  ...props
}: Omit<ComponentProps<"button">, "className"> & ButtonLook) {
  return (
    <button type="button" className={buttonClasses({ variant, wide, small })} {...props}>
      <Content variant={variant} icon={icon} iconEnd={iconEnd}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  wide,
  icon,
  iconEnd,
  onClick,
  children,
}: ButtonLook & { href: string; onClick?: () => void; children: ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className={buttonClasses({ variant, wide })}>
      <Content variant={variant} icon={icon} iconEnd={iconEnd}>
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
