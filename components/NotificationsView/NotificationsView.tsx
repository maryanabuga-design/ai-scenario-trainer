"use client";

import { Bell, ClipboardCheck, Clock, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { IconTile } from "@/components/IconTile/IconTile";
import { stepsCard } from "@/components/StepsView/StepCard";
import { groupNotifications, relativeTime, unreadCount } from "@/lib/notifications";
import type { AppNotification, NotificationType } from "@/lib/notifications";

const icons: Record<NotificationType, LucideIcon> = {
  reminder: Clock,
  result: ClipboardCheck,
  message: MessageSquare,
};

const cardClass = `${stepsCard} flex w-full items-start gap-3 p-[var(--gutter,1rem)] text-left active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`;

/**
 * One notification, in the standard list card. Unread shows only a small dot beside the title:
 * the card keeps the same background and border. A card with a target is a link, one without is a
 * button; both mark the notification as read.
 */
function NotificationCard({
  notification,
  now,
  onOpen,
}: {
  notification: AppNotification;
  now: number;
  onOpen: (notification: AppNotification) => void;
}) {
  const Icon = icons[notification.type];
  const content = (
    <>
      <IconTile className="h-9 w-9 rounded-full">
        <Icon size={18} strokeWidth={1.75} />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-start gap-2">
          <span className="type-body-strong min-w-0">
            {!notification.read && <span className="sr-only">Unread: </span>}
            {notification.title}
          </span>
          {!notification.read && (
            <span
              aria-hidden="true"
              data-unread-dot
              className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
            />
          )}
        </span>
        {notification.text && (
          <span className="type-small line-clamp-2 text-text-secondary">{notification.text}</span>
        )}
        <span className="type-caption text-text-secondary">
          {relativeTime(notification.createdAt, now)}
        </span>
      </span>
    </>
  );
  return notification.target ? (
    <Link href={notification.target} onClick={() => onOpen(notification)} className={cardClass}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={() => onOpen(notification)} className={cardClass}>
      {content}
    </button>
  );
}

function Group({
  caption,
  items,
  now,
  onOpen,
}: {
  caption: string;
  items: AppNotification[];
  now: number;
  onOpen: (notification: AppNotification) => void;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-label={caption} className="flex flex-col gap-3">
      <h2 className="type-label text-text-secondary">{caption}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((notification) => (
          <li key={notification.id}>
            <NotificationCard notification={notification} now={now} onOpen={onOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The Notifications screen: Back, "Mark all as read" (hidden when nothing is unread), the title and
 * two groups, "New" and "Earlier". Demo data and in-app events only.
 */
export function NotificationsView({
  items,
  now,
  onOpen,
  onMarkAll,
}: {
  items: AppNotification[];
  now: number;
  onOpen: (notification: AppNotification) => void;
  onMarkAll: () => void;
}) {
  const { fresh, earlier } = groupNotifications(items);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <CircleBackButton href="/" label="Back to Home" size="small" />
        {unreadCount(items) > 0 && (
          <Button variant="tertiary" onClick={onMarkAll}>
            Mark all as read
          </Button>
        )}
      </div>
      <h1 className="type-page-title">Notifications</h1>
      {items.length === 0 ? (
        <EmptyState icon={Bell} text="No notifications yet" />
      ) : (
        <div className="flex flex-col gap-6">
          <Group caption="New" items={fresh} now={now} onOpen={onOpen} />
          <Group caption="Earlier" items={earlier} now={now} onOpen={onOpen} />
        </div>
      )}
    </div>
  );
}
