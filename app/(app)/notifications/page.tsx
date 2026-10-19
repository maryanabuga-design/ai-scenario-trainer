"use client";

import { useState } from "react";
import { NotificationsView } from "@/components/NotificationsView/NotificationsView";
import type { AppNotification } from "@/lib/notifications";
import {
  markAllNotificationsRead,
  markNotificationRead,
  useNotifications,
} from "@/lib/notifications";

/** Rendered only once the browser has been read, so the time is never part of the prerender. */
function Loaded({ items }: { items: AppNotification[] }) {
  // the time is taken once per visit, so the relative times do not jump while the list is open
  const [now] = useState(() => Date.now());
  return (
    <NotificationsView
      items={items}
      now={now}
      onOpen={(notification) => markNotificationRead(notification.id)}
      onMarkAll={markAllNotificationsRead}
    />
  );
}

export default function NotificationsPage() {
  const items = useNotifications();
  if (items === "loading") return null;
  return <Loaded items={items} />;
}
