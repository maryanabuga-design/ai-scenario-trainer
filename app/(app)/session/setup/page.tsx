"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { defaultSetup, quizSize, SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { SetupValue } from "@/components/SessionSetup/SessionSetup";
import { pickQuestions } from "@/lib/quiz";
import { sessionLengths } from "@/lib/scenario";
import { startQuiz, startSession, useSession } from "@/lib/session";

export default function SetupPage() {
  const router = useRouter();
  const [value, setValue] = useState<SetupValue>(defaultSetup);
  const session = useSession();

  return (
    <SessionSetup
      value={value}
      onChange={setValue}
      replacesUnfinished={session !== "loading" && session !== null && !session.finished}
      onStart={() => {
        if (value.mode === "quiz") {
          startQuiz(pickQuestions(value.sections, quizSize(value).size), value.sections);
        } else {
          startSession(value.length, [...sessionLengths[value.length].stepIds]);
        }
        router.push("/session");
      }}
    />
  );
}
