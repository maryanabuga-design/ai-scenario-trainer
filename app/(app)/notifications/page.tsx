"use client";

import { useEffect, useState } from "react";
import { NotificationsView } from "@/components/NotificationsView/NotificationsView";
import { useCurrentAccount } from "@/lib/auth";
import type { Attempt } from "@/lib/cohort";
import { splitExams } from "@/lib/group-exams";
import { examsToTake } from "@/lib/exams-to-take";
import type { GroupExam } from "@/lib/group-exams";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import type { AppNotification } from "@/lib/notifications";
import { markAllNotificationsRead, unreadCount, useNotifications } from "@/lib/notifications";

/** Rendered only once the browser has been read, so the time is never part of the prerender. */
function Loaded({
  items,
  exams,
  attempts,
  email,
}: {
  items: AppNotification[];
  exams: GroupExam[];
  attempts: Attempt[];
  email: string;
}) {
  // the time is taken once per visit, so the relative times do not jump while the list is open
  const [now] = useState(() => Date.now());
  // the dots of this visit: what was unread when the screen opened (and what arrives while it is open)
  const [freshIds, setFreshIds] = useState(
    () => new Set(items.filter((n) => !n.read).map((n) => n.id)),
  );
  const unread = unreadCount(items);
  useEffect(() => {
    if (unread === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- remembers the new ones, then marks them read
    setFreshIds(
      (current) => new Set([...current, ...items.filter((n) => !n.read).map((n) => n.id)]),
    );
    markAllNotificationsRead();
  }, [unread, items]);
  return (
    <NotificationsView
      items={items}
      toTake={examsToTake(exams, attempts, email, now)}
      now={now}
      freshIds={freshIds}
      activeIds={new Set(splitExams(exams, now).active.map((exam) => exam.id))}
    />
  );
}

export default function NotificationsPage() {
  const items = useNotifications();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const account = useCurrentAccount();
  if (
    items === "loading" ||
    exams === "loading" ||
    attempts === "loading" ||
    account === "loading" ||
    account === null
  )
    return null;
  return <Loaded items={items} exams={exams} attempts={attempts} email={account.email} />;
}
