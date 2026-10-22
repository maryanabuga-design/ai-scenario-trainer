"use client";

import { useParams } from "next/navigation";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackagePartView, isPart } from "@/components/PackageContent/PackageStudentViews";
import { usePackages } from "@/lib/packages";

/** Preview as student: the student's part screen inside the Instructor's routes; nothing is saved. */
export default function PackagePreviewPage() {
  const params = useParams<{ id: string; part: string }>();
  const topics = usePackages();
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  if (!topic || !isPart(params.part)) return <ExamNotFound />;
  const exit = `/instructor/content/package/${topic.id}?tab=${params.part}`;
  return (
    <PackagePartView
      title={topic.title}
      part={params.part}
      data={topic}
      guideHref={(section) =>
        `/instructor/content/package/${topic.id}/preview/guide#section-${section}`
      }
      back={{ label: "Back to topic", href: exit }}
      preview={{ exitHref: exit }}
    />
  );
}
