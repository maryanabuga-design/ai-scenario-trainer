"use client";

import { useState } from "react";
import { SessionsListView } from "@/components/ProgressView/ProgressView";
import { useExam } from "@/lib/exam-store";
import { resultHrefFor } from "@/lib/result-links";
import { useHistory, useSession } from "@/lib/session";
import type { FinishedSession } from "@/lib/session";

function Loaded({ history }: { history: FinishedSession[] }) {
  const session = useSession();
  const exam = useExam();
  const [now] = useState(() => new Date());
  return <SessionsListView history={history} now={now} resultHref={resultHrefFor(session, exam)} />;
}

export default function SessionsPage() {
  const history = useHistory();
  if (history === "loading") return null;
  return <Loaded history={history ?? []} />;
}
