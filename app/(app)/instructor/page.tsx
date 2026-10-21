"use client";

import { useState } from "react";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { currentAccount, useAuth } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { groupCounts, participants } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { reminderExam, useAttempts, useGroupExams, useNotices } from "@/lib/group-store";
import { useContentSets } from "@/lib/content-sets";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { actionRows } from "@/lib/actions";
import { nearestActiveExam, weakestTopic } from "@/lib/overview";
import { readHistories } from "@/lib/student-data";
import { profiles } from "@/lib/students";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  name,
  accounts,
  exams,
  attempts,
  drafts,
  reminded,
}: {
  name: string;
  accounts: Account[];
  exams: GroupExam[];
  attempts: Attempt[];
  drafts: { id: string; title: string }[];
  reminded: ReadonlySet<string>;
}) {
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const people = participants(accounts);
  const exam = nearestActiveExam(exams, now);
  const list = profiles(people, readHistories(accounts));
  return (
    <InstructorOverviewView
      name={name}
      list={list}
      actions={actionRows({ list, exams, attempts, people, drafts, reminded, now })}
      exam={exam}
      counts={exam ? groupCounts(people, exam, { attempts, active: true }) : null}
      weakest={weakestTopic(list)}
      topicTitle={(id) => sections.find((section) => section.id === id)?.title ?? id}
    />
  );
}

export default function InstructorOverviewPage() {
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const sets = useContentSets();
  const notices = useNotices();
  if (
    auth === "loading" ||
    exams === "loading" ||
    attempts === "loading" ||
    sets === "loading" ||
    notices === "loading"
  )
    return null;
  const account = currentAccount(auth);
  return (
    <Loaded
      name={account?.name ?? "Instructor"}
      accounts={auth.accounts}
      exams={exams}
      attempts={attempts}
      drafts={sets
        .filter((set) => set.status === "draft")
        .map((set) => ({ id: set.id, title: set.title }))}
      reminded={new Set(notices.flatMap((notice) => reminderExam(notice.id) ?? []))}
    />
  );
}
