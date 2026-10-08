"use client";

import { useRouter } from "next/navigation";
import { ProgressView } from "@/components/ProgressView/ProgressView";
import { startQuiz, startSession, useHistory } from "@/lib/session";

export default function Progress() {
  const router = useRouter();
  const history = useHistory();

  if (history === "loading") return null;

  return (
    <ProgressView
      history={history ?? []}
      onRepeatSteps={(stepIds) => {
        startSession("repeat", stepIds);
        router.push("/session");
      }}
      onRepeatQuestions={(questionIds, sections) => {
        startQuiz(questionIds, sections, true);
        router.push("/session");
      }}
    />
  );
}
