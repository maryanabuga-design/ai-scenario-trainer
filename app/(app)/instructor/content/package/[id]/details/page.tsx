"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageDetailsEdit } from "@/components/InstructorContent/PackageDetailsEdit";
import { NO_ROOM, updatePackage, usePackages } from "@/lib/packages";

function Details() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const topics = usePackages();
  const [problem, setProblem] = useState("");
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  if (!topic) return <ExamNotFound />;
  const base = `/instructor/content/package/${topic.id}`;
  return (
    <>
      {problem && (
        <p role="alert" className="type-small text-status-attention-ink">
          {problem}
        </p>
      )}
      <PackageDetailsEdit
        title={topic.title}
        summary={topic.summary}
        backHref={base}
        onSave={(title, summary) => {
          const saved = updatePackage(topic.id, (t) => ({
            ...t,
            title: title.trim().slice(0, 120),
            summary: summary.trim().slice(0, 400),
            editedAt: Date.now(),
          }));
          if (saved) router.push(base);
          else setProblem(NO_ROOM);
        }}
        onCancel={() => router.push(base)}
      />
    </>
  );
}

export default function PackageDetailsPage() {
  // a page kept in the background keeps its state: hidden, it resets so the next visit starts from the topic
  const [shown, setShown] = useState(0);
  useEffect(() => () => setShown((n) => n + 1), []);
  return (
    <Suspense fallback={null}>
      <Details key={shown} />
    </Suspense>
  );
}
