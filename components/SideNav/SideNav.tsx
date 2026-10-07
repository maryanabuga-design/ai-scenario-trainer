"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Library" },
  { href: "/practice", label: "Practice" },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="flex flex-col gap-2 border-b border-border bg-surface px-4 py-3 md:w-56 md:shrink-0 md:gap-8 md:border-r md:border-b-0 md:px-4 md:py-8"
    >
      <p className="font-serif text-lg">Scenario trainer</p>
      <ul className="flex gap-2 md:flex-col">
        {items.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-control px-3 text-base transition-colors ${
                  current
                    ? "bg-surface-muted font-medium text-accent"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
