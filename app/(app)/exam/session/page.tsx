"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/Button/Button";
import { ExamTimer } from "@/components/ExamTimer/ExamTimer";
import { SessionRunner } from "@/components/SessionRunner/SessionRunner";
import { secondsLeft } from "@/lib/exam";
import { finishExam } from "@/lib/exam-session";
import { clearExam, isValidExam, saveExam, useExam } from "@/lib/exam-store";
import type { ExamSession } from "@/lib/exam-store";

function NoExam() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">No exam in progress</h1>
      <p className="text-text-secondary">Start the exam from its intro.</p>
      <ButtonLink href="/exam">Go to Exam</ButtonLink>
    </div>
  );
}

/** The current time, ticking every second; it also catches up when the tab becomes visible again. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return now;
}

function Runner({ exam }: { exam: ExamSession }) {
  const router = useRouter();
  const now = useNow();
  const left = secondsLeft(exam.endsAt, now);

  function finish() {
    finishExam(exam);
    router.replace("/exam/results");
  }

  // When the time is up the exam finishes by itself with the answers given so far.
  useEffect(() => {
    if (secondsLeft(exam.endsAt, Date.now()) === 0 && left === 0) {
      finishExam(exam);
      router.replace("/exam/results");
    }
  }, [left, exam, router]);

  return (
    <SessionRunner
      session={exam}
      unit="Question"
      hints={false}
      timer={<ExamTimer seconds={left} />}
      leave={{ title: "Leave the exam?", description: "Your progress will be lost." }}
      onChange={saveExam}
      onFinish={finish}
      onLeave={() => {
        clearExam();
        router.replace("/exam");
      }}
    />
  );
}

export default function ExamSessionPage() {
  const router = useRouter();
  const exam = useExam();
  const finished = exam !== "loading" && !!exam && exam.finished;

  useEffect(() => {
    if (finished) router.replace("/exam/results");
  }, [finished, router]);

  if (exam === "loading" || finished) return null;
  if (!exam || !isValidExam(exam)) return <NoExam />;
  return <Runner exam={exam} />;
}
