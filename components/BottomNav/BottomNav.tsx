"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Library" },
  { href: "/practice", label: "Practice" },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/practice")) return null;

  return (
    <nav
      aria-label="Main"
      className="border-t border-border bg-surface"
    >
      <ul className="flex">
        {items.map((item) => {
          const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 items-center justify-center text-base ${
                  current ? "font-medium text-accent" : "text-text-secondary"
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
