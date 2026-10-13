import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "text";

const variants: Record<Variant, string> = {
  primary:
    "type-button min-h-12 w-full bg-primary px-6 text-primary-text hover:opacity-90 active:opacity-80",
  secondary:
    "type-button min-h-11 border-[1.5px] border-primary bg-transparent px-5 text-primary active:bg-secondary-pressed",
  text: "type-body min-h-11 px-3 text-text underline decoration-1 underline-offset-4 hover:decoration-2 active:opacity-70 disabled:bg-transparent disabled:decoration-1",
};

function classes(variant: Variant) {
  return `inline-flex items-center justify-center rounded-full disabled:cursor-not-allowed disabled:border-transparent disabled:bg-neutral-surface disabled:text-text-secondary disabled:opacity-100 ${variants[variant]}`;
}

export function Button({
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
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
