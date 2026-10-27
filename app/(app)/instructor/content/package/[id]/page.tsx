"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import type { PackageDialog } from "@/components/InstructorContent/PackageTopicView";
import { checkPackage, isPathPart, partsOf } from "@/lib/package-read";
import { flaggedItems, keySlug, nothingFlagged } from "@/lib/package-review";
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
  const tab = isPathPart(asked) ? asked : (present[0] ?? "guide");
  const issues = checkPackage(topic);
  const base = `/instructor/content/package/${topic.id}`;

  function confirm() {
    const at = Date.now();
    if (dialog === "delete") {
      removePackage(topic!.id);
      router.push("/instructor/content");
      return;
    }
    // Publish is only offered when nothing is flagged; the check is repeated here
    if (dialog === "publish" && !nothingFlagged(issues)) {
      setDialog(null);
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
        onTab={(next) => router.replace(`${base}?tab=${next}`)}
        onReview={() => {
          // the round: every item flagged now, in order; a skipped one is visited again next time
          const round = flaggedItems(issues).map((item) => keySlug(item.key));
          if (round.length > 0) router.push(`${base}/edit/${round[0]}?r=${round.join(",")}&i=0`);
        }}
        onPreview={() => router.push(`${base}/preview`)}
        onEditDetails={() => router.push(`${base}/details`)}
        onReplace={() => router.push(`/instructor/content/import?replace=${topic.id}`)}
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
