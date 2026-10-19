"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { circleLook } from "@/components/CircleBackButton/CircleBackButton";
import { unreadCount, useNotifications } from "@/lib/notifications";

/** The badge text: the number of unread notifications, "9+" above nine. */
export const badgeText = (unread: number) => (unread > 9 ? "9+" : String(unread));

/** The accessible name of the bell. */
export const bellLabel = (unread: number) =>
  `Notifications, ${unread === 0 ? "no unread" : `${unread} unread`}`;

/**
 * The bell of the Home header: a white circle in the Back button style with a small count badge
 * while there are unread notifications. It opens the Notifications screen.
 */
export function NotificationBell() {
  const list = useNotifications();
  const unread = list === "loading" ? 0 : unreadCount(list);
  return (
    <Link
      href="/notifications"
      aria-label={bellLabel(unread)}
      className={`relative ${circleLook()}`}
    >
      <Bell size={20} strokeWidth={2} aria-hidden="true" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          data-unread-badge
          className="type-micro absolute -top-1 right-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-primary-text"
        >
          {badgeText(unread)}
        </span>
      )}
    </Link>
  );
}
