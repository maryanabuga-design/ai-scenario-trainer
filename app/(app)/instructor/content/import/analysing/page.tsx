"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  DocumentAnalysingView,
  STAGES,
} from "@/components/InstructorContent/DocumentAnalysingView";
import type { AnalysingPhase } from "@/components/InstructorContent/DocumentAnalysingView";
import { titleFromFileName } from "@/lib/content-import";
import { clearDocumentDraft, getDocumentDraft } from "@/lib/document-draft";
import { analyse, missingLine, readDocument } from "@/lib/document-read";
import { flaggedItems, keySlug } from "@/lib/package-review";
import { checkPackage } from "@/lib/package-read";
import { addPackage, createTopic, readPackages, replaceFiles, savePackages } from "@/lib/packages";
import type { DemoTopic } from "@/lib/packages";

const STAGE_MS = 700;
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/**
 * Analysing (DESIGN.md: One document in, a draft topic out): the stages advance about every 700 ms
 * while the document that Import handed over is read. The analysis is simulated: the reader is the
 * template reader, the stages show its real numbers. The draft topic is saved only when the analysis
 * finishes; Cancel or leaving earlier saves nothing.
 */
function Analysing() {
  const router = useRouter();
  const query = useSearchParams();
  const replaceId = query.get("replace");
  const draft = useMemo(() => getDocumentDraft(), []);
  const read = useMemo(() => (draft ? readDocument(draft.bytes) : null), [draft]);
  const analysis = useMemo(
    () => (read && draft ? analyse(read, draft.images) : null),
    [read, draft],
  );
  const usable = analysis !== null && analysis.counts.guide > 0;
  const [done, setDone] = useState(0);
  const [phase, setPhase] = useState<AnalysingPhase>(usable ? "running" : "error");
  const [topic, setTopic] = useState<DemoTopic | null>(null);
  const saved = useRef(false);

  useEffect(() => {
    if (!draft) router.replace("/instructor/content/import");
  }, [draft, router]);

  const results = analysis
    ? [
        `${n(read!.files.length, "sheet")} read`,
        `${analysis.counts.guide} found`,
        `${n(analysis.counts.steps, "step")}, ${n(analysis.counts.scenario, "scenario step")}`,
        analysis.counts.questions > 0 ? n(analysis.counts.questions, "question") : "none found",
        analysis.linkProblems === 0 ? "all linked" : `${analysis.linkProblems} to check`,
      ]
    : [];

  /** Creates (or replaces into) the draft topic: once, only when the analysis is over. */
  function save(): DemoTopic | null {
    if (saved.current || !draft || !analysis) return topic;
    saved.current = true;
    const now = Date.now();
    const existing = readPackages();
    const target = replaceId ? existing.find((t) => t.id === replaceId) : undefined;
    const title = analysis.data.title || target?.title || titleFromFileName(draft.name);
    const summary = analysis.data.summary || target?.summary || "";
    const next = target
      ? replaceFiles(target, analysis.data, target.title, target.summary, now)
      : createTopic(analysis.data, title, summary, now, existing);
    const ok = target
      ? savePackages(existing.map((t) => (t.id === target.id ? next : t)))
      : addPackage(next);
    if (!ok) {
      savePackages(existing);
      saved.current = false;
      setPhase("error");
      return null;
    }
    clearDocumentDraft();
    setTopic(next);
    return next;
  }

  useEffect(() => {
    if (!usable) return;
    const finish = () => {
      setDone(STAGES.length);
      if (analysis.missing.length > 0) setPhase("partial");
      else if (save()) setPhase("finished");
    };
    // reduced motion: every stage shows at once, without animation
    if (reduced()) {
      const timer = window.setTimeout(finish, 0);
      return () => window.clearTimeout(timer);
    }
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1;
      if (current >= STAGES.length) {
        window.clearInterval(timer);
        finish();
      } else setDone(current);
    }, STAGE_MS);
    return () => window.clearInterval(timer);
    // the analysis starts once; it reads the document that Import handed over
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!draft && !topic) return null;
  const base = topic ? `/instructor/content/package/${topic.id}` : "";
  const flagged = topic ? flaggedItems(checkPackage(topic)) : [];
  return (
    <DocumentAnalysingView
      fileName={draft?.name ?? ""}
      phase={phase}
      done={phase === "running" ? done : STAGES.length}
      results={results}
      counts={analysis?.counts ?? { guide: 0, steps: 0, scenario: 0, questions: 0 }}
      linkProblems={analysis?.linkProblems ?? 0}
      partialLine={analysis ? missingLine(analysis.missing) : ""}
      reviewCount={flagged.length}
      onCancel={() => router.push("/instructor/content/import")}
      onContinue={() => {
        if (save()) setPhase("finished");
      }}
      onChooseAnother={() => {
        clearDocumentDraft();
        router.push(`/instructor/content/import${replaceId ? `?replace=${replaceId}` : ""}`);
      }}
      onReview={() => {
        const round = flagged.map((item) => keySlug(item.key));
        router.push(`${base}/edit/${round[0]}?r=${round.join(",")}&i=0`);
      }}
      onPreview={() => router.push(`${base}/preview`)}
      onBackToContent={() => router.push("/instructor/content")}
    />
  );
}

export default function AnalysingPage() {
  // a page kept in the background keeps its state: hidden, it resets, so the next visit starts over
  const [shown, setShown] = useState(0);
  useEffect(() => () => setShown((count) => count + 1), []);
  return (
    <Suspense fallback={null}>
      <Analysing key={shown} />
    </Suspense>
  );
}
