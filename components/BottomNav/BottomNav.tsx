"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = (path: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

const items = [
  { href: "/", label: "Home", icon: icon(<path d="M4 10.5 12 4l8 6.5V20h-5v-6h-6v6H4z" />) },
  {
    href: "/materials",
    label: "Materials",
    icon: icon(<path d="M6 4h9l3 3v13H6zM9 10h6M9 14h6" />),
  },
  { href: "/progress", label: "Progress", icon: icon(<path d="M5 20V12M12 20V5M19 20v-9" />) },
  {
    href: "/profile",
    label: "Profile",
    icon: icon(
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5 20c1.2-3.5 3.8-5 7-5s5.8 1.5 7 5" />
      </>,
    ),
  },
];

function isCurrent(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav({ activePath }: { activePath?: string }) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;

  if (!items.some((item) => isCurrent(item.href, pathname))) return null;

  return (
    <nav aria-label="Main" className="border-t border-border bg-surface">
      <ul className="flex">
        {items.map((item) => {
          const current = isCurrent(item.href, pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 pt-2 pb-1 text-xs ${
                  current ? "font-medium text-text" : "text-text-secondary hover:text-text"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${
                    current ? "bg-surface-muted" : ""
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
