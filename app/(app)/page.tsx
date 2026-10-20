"use client";

import { useState } from "react";
import { HomeView } from "@/components/HomeView/HomeView";
import { localStatus } from "@/lib/cohort";
import { splitExams } from "@/lib/group-exams";
import { useAttempts, useGroupExams } from "@/lib/group-store";
import { homeCounts, homeSummary } from "@/lib/home";
import { useSaved } from "@/lib/saved";
import { useHistory, useProfile, useSession } from "@/lib/session";
import { useCurrentAccount } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import type { Attempt } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import type { FinishedSession, Session } from "@/lib/session";

/** Rendered once everything is read, so the time is never part of the prerender. */
function Loaded({
  account,
  session,
  history,
  saved,
  exams,
  attempts,
}: {
  account: Account;
  session: Session | null;
  history: FinishedSession[] | null;
  saved: string[] | null;
  exams: GroupExam[];
  attempts: Attempt[];
}) {
  const [now] = useState(() => Date.now());
  const unfinished = session && !session.finished ? session : null;
  // the Active group exams this student has not passed yet (nearest deadline first, at most three)
  const assigned = splitExams(exams, now)
    .active.filter((exam) => localStatus(attempts, account.email, exam.id).kind !== "certified")
    .slice(0, 3);

  return (
    <HomeView
      name={account.name}
      summary={homeSummary({ unfinished, history })}
      counts={homeCounts({ history, saved })}
      assigned={assigned}
    />
  );
}

export default function Home() {
  const profile = useProfile();
  const session = useSession();
  const history = useHistory();
  const saved = useSaved();
  const account = useCurrentAccount();
  const exams = useGroupExams();
  const attempts = useAttempts();

  if (
    profile === "loading" ||
    session === "loading" ||
    history === "loading" ||
    saved === "loading" ||
    account === "loading" ||
    account === null ||
    exams === "loading" ||
    attempts === "loading"
  ) {
    return null;
  }

  return (
    <Loaded
      account={account}
      session={session}
      history={history}
      saved={saved}
      exams={exams}
      attempts={attempts}
    />
  );
}
