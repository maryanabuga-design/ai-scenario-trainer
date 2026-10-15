"use client";

import { useRouter } from "next/navigation";
import { ExamIntroView } from "@/components/ExamIntroView/ExamIntroView";
import { examResults } from "@/lib/exam";
import { startExam } from "@/lib/exam-session";
import { useHistory } from "@/lib/session";

export default function ExamIntro() {
  const router = useRouter();
  const history = useHistory();
  if (history === "loading") return null;
  const { last, best } = examResults(history);

  return (
    <ExamIntroView
      last={last}
      best={best}
      onStart={() => {
        startExam();
        window.scrollTo(0, 0);
        router.push("/exam/session");
      }}
    />
  );
}
