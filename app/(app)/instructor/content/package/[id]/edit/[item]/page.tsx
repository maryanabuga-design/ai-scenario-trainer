"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageItemEdit, PackagePartStep } from "@/components/InstructorContent/PackageItemEdit";
import { setItem } from "@/lib/package-edit";
import { checkPackage } from "@/lib/package-read";
import {
  flaggedItems,
  itemName,
  keyOfSlug,
  keySlug,
  nextRound,
  parseKey,
  tabOfKey,
} from "@/lib/package-review";
import { pathOf, setFlash } from "@/lib/flash";
import { NO_ROOM, readPackages, updatePackage, usePackages } from "@/lib/packages";

/**
 * The edit screen of one item of a demo topic, alone or as a step of the guided review
 * (`?r=<items of the round>&i=<position>`). Saving and skipping go to the next item of the round that
 * is still flagged; after the last one the review ends on its summary screen.
 */
function Edit() {
  const params = useParams<{ id: string; item: string }>();
  const router = useRouter();
  const query = useSearchParams();
  const topics = usePackages();
  const [problem, setProblem] = useState("");
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  const itemKey = keyOfSlug(params.item);
  if (!topic || !itemKey) return <ExamNotFound />;

  const base = `/instructor/content/package/${topic.id}`;
  const round = (query.get("r") ?? "")
    .split(",")
    .map(keyOfSlug)
    .filter((key): key is string => key !== null);
  const at = Math.max(0, Number(query.get("i") ?? 0) || 0);
  const review = round.length > 0 ? { position: at + 1, total: round.length } : null;
  const tab = tabOfKey(itemKey) ?? "guide";
  const leave = () => router.push(`${base}?tab=${tab}`);

  /** Where the review goes on: the next item still flagged, or the summary after the last one. */
  function nextUrl(): string {
    const fresh = readPackages().find((entry) => entry.id === topic!.id);
    if (!review || !fresh) return base;
    const flagged = new Set(flaggedItems(checkPackage(fresh)).map((item) => item.key));
    const { round: next, next: n } = nextRound(round, at, flagged);
    if (n === null) return `${base}/review`;
    return `${base}/edit/${keySlug(next[n])}?r=${next.map(keySlug).join(",")}&i=${n}`;
  }
  const goNext = () => router.push(nextUrl());

  const issues = checkPackage(topic);
  if (itemKey.endsWith(":all")) {
    const reasons = issues.filter((issue) => issue.key === itemKey && issue.kind === "must");
    return (
      <PackagePartStep
        title={itemName(topic, itemKey)}
        review={review}
        reasons={reasons.map((issue) => issue.reason)}
        replaceHref={`/instructor/content/import?replace=${topic.id}`}
        onSkip={goNext}
        onLeave={() => router.push(base)}
      />
    );
  }
  if (!parseKey(topic, itemKey)) return <ExamNotFound />;

  return (
    <>
      {problem && (
        <p role="alert" className="type-small text-status-attention-ink">
          {problem}
        </p>
      )}
      <PackageItemEdit
        key={itemKey}
        data={topic}
        itemKey={itemKey}
        review={review}
        initialIssues={issues}
        onLeave={review ? () => router.push(base) : leave}
        onSkip={goNext}
        onSave={(item, images) => {
          const saved = updatePackage(topic.id, (t) => ({
            ...setItem({ ...t, images }, itemKey, item),
            editedAt: Date.now(),
          }));
          if (!saved) {
            setProblem(NO_ROOM);
            return;
          }
          // "Changes saved" shows on the screen the person lands on; the end of the review keeps its
          // own "All items checked" notice
          const target = review ? nextUrl() : `${base}?tab=${tab}`;
          if (!target.endsWith("/review")) setFlash("Changes saved", pathOf(target));
          router.push(target);
        }}
      />
    </>
  );
}

export default function PackageItemEditPage() {
  return (
    <Suspense fallback={null}>
      <Edit />
    </Suspense>
  );
}
