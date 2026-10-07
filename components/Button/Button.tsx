import Link from "next/link";
import type { ReactNode } from "react";

const base =
  "flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-4 text-base font-medium text-primary-text hover:opacity-90 active:opacity-80";

export function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}
