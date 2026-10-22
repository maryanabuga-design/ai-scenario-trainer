"use client";

import { useParams } from "next/navigation";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageQuestionView } from "@/components/InstructorContent/PackageQuestionViews";
import { checkPackage } from "@/lib/package-read";
import { usePackages } from "@/lib/packages";

export default function PackageQuestionPage() {
  const params = useParams<{ id: string; n: string }>();
  const topics = usePackages();
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  const index = Number(params.n);
  if (!topic || !topic.questions || !Number.isInteger(index) || !topic.questions[index]) {
    return <ExamNotFound />;
  }
  const base = `/instructor/content/package/${topic.id}`;
  return (
    <PackageQuestionView
      data={topic}
      index={index}
      issues={checkPackage(topic).filter((issue) => issue.key === `questions:${index}`)}
      backHref={`${base}?tab=quiz`}
      editHref={`${base}/question/${index}/edit`}
      guideHref={(section) => `${base}?tab=guide#section-${section}`}
    />
  );
}
