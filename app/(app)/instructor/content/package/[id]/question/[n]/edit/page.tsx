"use client";

import { useParams, useRouter } from "next/navigation";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageQuestionEdit } from "@/components/InstructorContent/PackageQuestionViews";
import { updatePackage, usePackages } from "@/lib/packages";

export default function PackageQuestionEditPage() {
  const params = useParams<{ id: string; n: string }>();
  const router = useRouter();
  const topics = usePackages();
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  const index = Number(params.n);
  if (!topic || !topic.questions || !Number.isInteger(index) || !topic.questions[index]) {
    return <ExamNotFound />;
  }
  const base = `/instructor/content/package/${topic.id}`;
  return (
    <PackageQuestionEdit
      data={topic}
      index={index}
      backHref={`${base}/question/${index}`}
      onSave={(question) => {
        updatePackage(topic.id, (t) => ({
          ...t,
          questions: t.questions!.map((q, i) => (i === index ? question : q)),
          editedAt: Date.now(),
        }));
        router.push(`${base}?tab=quiz`);
      }}
    />
  );
}
