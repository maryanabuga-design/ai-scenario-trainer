"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartNoAxesColumn, FileText, House, User } from "lucide-react";

const items = [
  { href: "/", label: "Home", Icon: House },
  { href: "/materials", label: "Materials", Icon: FileText },
  { href: "/progress", label: "Progress", Icon: ChartNoAxesColumn },
  { href: "/profile", label: "Profile", Icon: User },
];

function isCurrent(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav({ activePath }: { activePath?: string }) {
  const currentPath = usePathname();
  const pathname = activePath ?? currentPath;

  if (!items.some((item) => isCurrent(item.href, pathname))) return null;

  return (
    <nav
      aria-label="Main"
      className="mx-4 mt-2 mb-3 rounded-full border border-border bg-surface p-1.5 shadow-[0_2px_12px_color-mix(in_srgb,var(--text)_8%,transparent)]"
    >
      <ul className="flex gap-1">
        {items.map((item) => {
          const current = isCurrent(item.href, pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full type-caption ${
                  current ? "bg-nav-active text-text" : "text-text-secondary"
                }`}
              >
                <item.Icon size={22} strokeWidth={2} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
