"use client";

import { Bell, ClipboardCheck, Clock, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AssignedExamCard } from "@/components/AssignedExamCard/AssignedExamCard";
import { Chevron } from "@/components/Chevron/Chevron";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { EmptyState } from "@/components/EmptyState/EmptyState";
import { IconTile } from "@/components/IconTile/IconTile";
import type { GroupExam } from "@/lib/group-exams";
import { relativeTime } from "@/lib/notifications";
import type { AppNotification, NotificationType } from "@/lib/notifications";

const icons: Record<NotificationType, LucideIcon> = {
  reminder: Clock,
  result: ClipboardCheck,
  message: MessageSquare,
};

const rowClass =
  "flex h-[72px] w-full items-center gap-3 rounded-card bg-card px-4 text-left shadow-(--card-shadow) has-focus-visible:outline-2";

/** The exam a target opens ("/exam?id=<id>"), or null for any other target. */
export const examOfTarget = (target: string | null) => {
  const match = target === null ? null : /^\/exam\?id=([A-Za-z0-9-]+)$/.exec(target);
  return match ? match[1] : null;
};

/**
 * One history row of a fixed 72px: the icon tile, the title on one line, the date and a small dot
 * while it is new. It is a link with a chevron only when it leads somewhere: a row about an exam
 * leads there only while that exam is still Active; any other row with a target always does.
 */
function HistoryRow({
  notification,
  now,
  fresh,
  activeExamIds,
}: {
  notification: AppNotification;
  now: number;
  fresh: boolean;
  activeExamIds: Set<string>;
}) {
  const Icon = icons[notification.type];
  const exam = examOfTarget(notification.target);
  const opens = notification.target !== null && (exam === null || activeExamIds.has(exam));
  const content = (
    <>
      <IconTile className="h-9 w-9 rounded-full">
        <Icon size={18} strokeWidth={1.75} />
      </IconTile>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-strong line-clamp-2 leading-snug">
          {fresh && <span className="sr-only">Unread: </span>}
          {notification.title}
        </span>
        <span className="type-caption text-text-secondary">
          {relativeTime(notification.createdAt, now)}
        </span>
      </span>
      {fresh && (
        <span
          aria-hidden="true"
          data-unread-dot
          className="h-2 w-2 shrink-0 rounded-full bg-primary"
        />
      )}
      {opens && <Chevron />}
    </>
  );
  return opens ? (
    <Link href={notification.target!} data-history-row={notification.id} className={rowClass}>
      {content}
    </Link>
  ) : (
    <div data-history-row={notification.id} className={rowClass}>
      {content}
    </div>
  );
}

/**
 * The Notifications screen (DESIGN.md: Assigned exams move into Notifications): Back, the title and
 * two sections, "EXAMS TO TAKE" (the assigned exams still to do, from the current exam state) and
 * "EARLIER" (the history). Demo data and in-app events only.
 */
export function NotificationsView({
  items,
  toTake,
  now,
  freshIds,
  activeIds,
}: {
  /** The history, newest first. */
  items: AppNotification[];
  /** The Active group exams this student has not passed yet. */
  toTake: GroupExam[];
  now: number;
  /** The ids that were unread when the screen was opened: their dots stay for this visit. */
  freshIds: Set<string>;
  /** The ids of every Active exam (passed or not): a row about one of them opens its intro. */
  activeIds?: Set<string>;
}) {
  const activeExamIds = activeIds ?? new Set(toTake.map((exam) => exam.id));
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <CircleBackButton href="/" label="Back to Home" size="small" />
      <h1 className="type-page-title">Notifications</h1>
      {items.length === 0 && toTake.length === 0 ? (
        <EmptyState icon={Bell} text="No notifications yet" />
      ) : (
        <>
          {toTake.length > 0 && (
            <section aria-labelledby="to-take-title" className="flex flex-col gap-3">
              <h2 id="to-take-title" className="type-label text-text-secondary">
                EXAMS TO TAKE
              </h2>
              <ul className="flex flex-col gap-3">
                {toTake.map((exam) => (
                  <li key={exam.id}>
                    <AssignedExamCard exam={exam} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {sorted.length > 0 && (
            <section aria-labelledby="earlier-title" className="flex flex-col gap-3">
              <h2 id="earlier-title" className="type-label text-text-secondary">
                EARLIER
              </h2>
              <ul className="flex flex-col gap-2">
                {sorted.map((notification) => (
                  <li key={notification.id}>
                    <HistoryRow
                      notification={notification}
                      now={now}
                      fresh={freshIds.has(notification.id)}
                      activeExamIds={activeExamIds}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
