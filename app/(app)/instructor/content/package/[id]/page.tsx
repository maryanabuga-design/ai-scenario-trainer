"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import type { PackageDialog } from "@/components/InstructorContent/PackageTopicView";
import { isPart } from "@/components/PackageContent/PackageStudentViews";
import { checkPackage, partsOf } from "@/lib/package-read";
import { NO_ROOM, removePackage, updatePackage, usePackages } from "@/lib/packages";

function Topic() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useSearchParams();
  const topics = usePackages();
  const [dialog, setDialog] = useState<PackageDialog>(null);
  const [problem, setProblem] = useState("");
  const [now] = useState(() => Date.now());
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  if (!topic) return <ExamNotFound />;
  const present = partsOf(topic);
  const asked = query.get("tab") ?? "";
  const tab = isPart(asked) ? asked : (present[0] ?? "guide");
  const issues = checkPackage(topic);

  function confirm() {
    const at = Date.now();
    if (dialog === "delete") {
      removePackage(topic!.id);
      router.push("/instructor/content");
      return;
    }
    const saved = updatePackage(topic!.id, (t) =>
      dialog === "publish"
        ? { ...t, status: "published", publishedAt: at, editedAt: at }
        : { ...t, status: "draft", editedAt: at },
    );
    setProblem(saved ? "" : NO_ROOM);
    setDialog(null);
  }

  return (
    <>
      {problem && (
        <p role="alert" className="type-small text-status-attention-ink">
          {problem}
        </p>
      )}
      <PackageTopicView
        topic={topic}
        tab={tab}
        issues={issues}
        now={now}
        dialog={dialog}
        onTab={(next) => router.replace(`/instructor/content/package/${topic.id}?tab=${next}`)}
        onAsk={setDialog}
        onConfirm={confirm}
        onCancelDialog={() => setDialog(null)}
      />
    </>
  );
}

export default function PackageTopicPage() {
  return (
    <Suspense fallback={null}>
      <Topic />
    </Suspense>
  );
}
