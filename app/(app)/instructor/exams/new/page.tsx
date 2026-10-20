"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssignExamView } from "@/components/InstructorExams/AssignExamView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { createExam, shortDate } from "@/lib/group-exams";
import { addNotice, saveGroupExam } from "@/lib/group-store";

export default function AssignExamPage() {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const [now] = useState(() => Date.now());
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  return (
    <AssignExamView
      titleOf={titleOf}
      now={now}
      onCancel={() => router.push("/instructor/exams")}
      onAssign={(values) => {
        const at = Date.now();
        const exam = createExam(values, at);
        saveGroupExam(exam);
        // every local student account gets the notification once
        addNotice({
          id: `notice-${exam.id}`,
          title: `New exam assigned: ${exam.title}, due ${shortDate(exam.deadline)}`,
          text: "Open the exam to see the rules and start.",
          target: `/exam?id=${exam.id}`,
          createdAt: at,
        });
        router.push(`/instructor/exams/${exam.id}?assigned=1`);
      }}
    />
  );
}
