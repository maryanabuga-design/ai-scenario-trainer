import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary:
    "min-h-12 w-full bg-primary px-6 font-medium text-primary-text hover:opacity-90 active:opacity-80 disabled:bg-surface-muted disabled:text-text-secondary disabled:opacity-100",
  secondary:
    "min-h-11 border border-text bg-surface px-5 font-medium text-text hover:bg-surface-muted active:bg-border disabled:border-border disabled:text-text-secondary",
  text: "min-h-11 px-3 text-text hover:underline active:opacity-70 disabled:text-text-secondary disabled:no-underline",
};

function classes(variant: Variant) {
  return `inline-flex items-center justify-center rounded-full text-base disabled:cursor-not-allowed ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={classes(variant)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
}: {
  href: string;
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classes(variant)}>
      {children}
    </Link>
  );
}
