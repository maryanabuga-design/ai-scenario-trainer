"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { createExam, shortDate } from "@/lib/group-exams";
import { addNotice, saveGroupExam } from "@/lib/group-store";

function AssignExam() {
  const router = useRouter();
  const fromOverview = useSearchParams().get("from") === "overview";
  const home = fromOverview ? "/instructor" : "/instructor/exams";
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <AssignExamView
      titleOf={titleOf}
      now={now}
      fromOverview={fromOverview}
      onCancel={() => router.push(home)}
      onAssign={(values) => {
        const at = Date.now();
        const exam = createExam(values, at);
        saveGroupExam(exam);
        // every local student account gets the notification once
        addNotice({
          id: `notice-${exam.id}`,
          title: `New exam assigned: ${exam.title}`,
          text: `Due ${shortDate(exam.deadline)}. Open the exam to see the rules and start.`,
          target: `/exam?id=${exam.id}`,
          createdAt: at,
        });
        router.push(
          `/instructor/exams/${exam.id}?assigned=1${fromOverview ? "&from=overview" : ""}`,
        );
      }}
    />
  );
}

export default function AssignExamPage() {
  return (
    <Suspense fallback={null}>
      <AssignExam />
    </Suspense>
  );
}
