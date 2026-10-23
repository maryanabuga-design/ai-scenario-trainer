"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ExamNotFound } from "@/components/InstructorExams/ExamDetailView";
import { PackageTopicView } from "@/components/InstructorContent/PackageTopicView";
import type { PackageDialog } from "@/components/InstructorContent/PackageTopicView";
import { checkPackage, isPathPart, nextIssue, partsOf, tabOfIssue } from "@/lib/package-read";
import { NO_ROOM, removePackage, updatePackage, usePackages } from "@/lib/packages";

function Topic() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const query = useSearchParams();
  const topics = usePackages();
  const [dialog, setDialog] = useState<PackageDialog>(null);
  const [problem, setProblem] = useState("");
  const [now] = useState(() => Date.now());
  /** The issue "Show next issue" visited last, and the one to bring into view once its tab is drawn. */
  const [visited, setVisited] = useState<string | null>(null);
  const [target, setTarget] = useState<{ id: string; tab: string } | null>(null);
  const search = query.toString();
  useEffect(() => {
    if (!target) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // a page kept in the background has a copy of the same elements: take the one on screen
    const shown = (selector: string) =>
      [...document.querySelectorAll<HTMLElement>(selector)].find((el) => el.offsetParent !== null);
    // the notice of a tab stands in for a note about a whole part, once that tab is the one shown
    const found =
      shown(`[data-issue-ids~="${target.id}"]`) ??
      (new URLSearchParams(search).get("tab") === target.tab ? shown("#tab-notice") : undefined);
    if (!found) return;
    document.querySelectorAll("[data-flash]").forEach((el) => el.removeAttribute("data-flash"));
    found.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "center" });
    found.focus({ preventScroll: true });
    found.setAttribute("data-flash", "true");
    const timer = window.setTimeout(() => found.removeAttribute("data-flash"), 2000);
    return () => {
      window.clearTimeout(timer);
      found.removeAttribute("data-flash");
    };
  }, [target, search]);
  if (topics === "loading") return null;
  const topic = topics.find((entry) => entry.id === params.id);
  if (!topic) return <ExamNotFound />;
  const present = partsOf(topic);
  const asked = query.get("tab") ?? "";
  const tab = isPathPart(asked) ? asked : (present[0] ?? "guide");
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
        onNextIssue={() => {
          const next = nextIssue(issues, visited);
          if (!next) return;
          setVisited(next.id);
          const where = tabOfIssue(next);
          const show = where ?? tab;
          if (show !== tab || query.get("tab") === null) {
            router.replace(`/instructor/content/package/${topic.id}?tab=${show}`);
          }
          setTarget({ id: next.id, tab: show });
        }}
        onPreview={() => router.push(`/instructor/content/package/${topic.id}/preview`)}
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
