"use client";

import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageReviewSummary } from "@/components/InstructorContent/PackageReviewSummary";
import { checkPackage } from "@/lib/package-read";
import { flaggedItems, keySlug, nothingFlagged } from "@/lib/package-review";
import { setFlash } from "@/lib/flash";
import { NO_ROOM, updatePackage, usePackages } from "@/lib/packages";

/** Where the guided review ends: a summary of what is checked and what still needs attention. */
function Summary() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const topics = usePackages();
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState("");
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  if (!topic) return <ExamNotFound />;
  const issues = checkPackage(topic);
  const base = `/instructor/content/package/${topic.id}`;

  function publish() {
    // Publish is only offered when nothing is flagged; the check is repeated here
    if (!nothingFlagged(issues)) return setPublishing(false);
    const at = Date.now();
    const saved = updatePackage(topic!.id, (t) => ({
      ...t,
      status: "published",
      publishedAt: at,
      editedAt: at,
    }));
    if (!saved) {
      setProblem(NO_ROOM);
      setPublishing(false);
      return;
    }
    setFlash("Topic published", base);
    router.push(base);
  }

  return (
    <>
      {problem && (
        <p role="alert" className="type-small text-status-attention-ink">
          {problem}
        </p>
      )}
      <PackageReviewSummary
        topic={topic}
        issues={issues}
        publishing={publishing}
        onPublishAsk={() => setPublishing(true)}
        onPublish={publish}
        onPublishCancel={() => setPublishing(false)}
        onReview={() => {
          const round = flaggedItems(issues).map((item) => keySlug(item.key));
          router.push(`${base}/edit/${round[0]}?r=${round.join(",")}&i=0`);
        }}
        onPreview={() => router.push(`${base}/preview`)}
        onBack={() => router.push(base)}
      />
    </>
  );
}

export default function PackageReviewSummaryPage() {
  return (
    <Suspense fallback={null}>
      <Summary />
    </Suspense>
  );
}
