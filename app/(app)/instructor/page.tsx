"use client";

import { useState } from "react";
import { InstructorOverviewView } from "@/components/InstructorOverview/InstructorOverviewView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { currentAccount, useAuth } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { participants } from "@/lib/cohort";
import type { Attempt } from "@/lib/cohort";
import { useContentSets } from "@/lib/content-sets";
import type { GroupExam } from "@/lib/group-exams";
import { reminderExam, useAttempts, useGroupExams, useNotices } from "@/lib/group-store";
import type { Scope } from "@/lib/groups";
import { overviewModel } from "@/lib/overview-model";
import { saveScope, useScope } from "@/lib/scope-store";
import { readHistories } from "@/lib/student-data";
import { profiles } from "@/lib/students";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  name,
  accounts,
  exams,
  attempts,
  drafts,
  publishedSets,
  reminded,
  scope,
}: {
  name: string;
  accounts: Account[];
  exams: GroupExam[];
  attempts: Attempt[];
  drafts: { id: string; title: string }[];
  publishedSets: number;
  reminded: ReadonlySet<string>;
  scope: Scope;
}) {
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const people = participants(accounts);
  const list = profiles(people, readHistories(accounts), now);
  return (
    <InstructorOverviewView
      name={name}
      model={overviewModel({
        scope,
        list,
        people,
        exams,
        attempts,
        drafts,
        publishedSets,
        reminded,
        now,
      })}
      topicTitle={(id) => sections.find((section) => section.id === id)?.title ?? id}
      onSelectGroup={(id) => saveScope(id)}
    />
  );
}

export default function InstructorOverviewPage() {
  const auth = useAuth();
  const exams = useGroupExams();
  const attempts = useAttempts();
  const sets = useContentSets();
  const notices = useNotices();
  const scope = useScope();
  if (
    auth === "loading" ||
    exams === "loading" ||
    attempts === "loading" ||
    sets === "loading" ||
    notices === "loading" ||
    scope === "loading"
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
      publishedSets={sets.filter((set) => set.status === "published").length}
      reminded={new Set(notices.flatMap((notice) => reminderExam(notice.id) ?? []))}
      scope={scope}
    />
  );
}
