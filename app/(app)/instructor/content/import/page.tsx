"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { PackageImportView } from "@/components/InstructorContent/PackageImportView";
import type { QuestionsChoice } from "@/components/InstructorContent/PackageImportView";
import { chooseDraftFile, clearDraft } from "@/lib/import-draft";
import { checkPackage, csvPart, fileKind, fixMessage, readPackage } from "@/lib/package-read";
import type { PathPart } from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";
import {
  NO_ROOM,
  addPackage,
  createTopic,
  readPackages,
  replaceFiles,
  savePackages,
  usePackages,
} from "@/lib/packages";

const readAs = (file: File, mode: "text" | "url") =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    if (mode === "text") reader.readAsText(file, "UTF-8");
    else reader.readAsDataURL(file);
  });

const tabFrom = (value: string): PathPart | null =>
  value === "guide" || value === "steps" || value === "scenario" || value === "quiz" ? value : null;

const clock = () => Date.now();
const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Import() {
  const router = useRouter();
  const query = useSearchParams();
  const replaceId = query.get("replace");
  const fixTab = query.get("fix");
  const topics = usePackages();
  const [files, setFiles] = useState<PackageFile[]>([]);
  const [title, setTitle] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState("");
  const [choice, setChoice] = useState<QuestionsChoice>(null);
  const outcome = useMemo(() => readPackage(files), [files]);
  if (topics === "loading") return null;
  const target = replaceId ? topics.find((t) => t.id === replaceId) : undefined;

  const shownTitle = title ?? (outcome.data.title || target?.title || "");
  const shownSummary = summary ?? (outcome.data.summary || target?.summary || "");
  const onlyQuestions =
    outcome.recognised.length === 1 && outcome.recognised[0].part === "questions" && !target;

  async function choose(chosen: File[]) {
    const next = await Promise.all(
      chosen.map(async (file): Promise<PackageFile> => {
        const kind = fileKind(file.name);
        if (kind === "csv" && file.size <= 1024 * 1024) {
          return { name: file.name, size: file.size, text: await readAs(file, "text") };
        }
        if (kind === "image" && file.size <= 300 * 1024) {
          return { name: file.name, size: file.size, dataUrl: await readAs(file, "url") };
        }
        return { name: file.name, size: file.size };
      }),
    );
    setProblem("");
    // a file chosen later replaces an earlier one of the same name or of the same part
    const parts = new Set(next.map(csvPart).filter((part) => part !== null));
    setFiles((current) => [
      ...current.filter((existing) => {
        const part = csvPart(existing);
        return !next.some((entry) => entry.name === existing.name) && !(part && parts.has(part));
      }),
      ...next,
    ]);
  }

  async function run() {
    if (outcome.recognised.length === 0 || shownTitle.trim() === "") return;
    setProblem("");
    if (onlyQuestions && choice === "builtin") {
      const questions = files.find((f) => fileKind(f.name) === "csv" && f.text !== undefined)!;
      clearDraft();
      chooseDraftFile(new File([questions.text ?? ""], questions.name, { type: "text/csv" }), null);
      router.push("/instructor/content/import/questions");
      return;
    }
    setReading(true);
    if (!reduced()) await pause(1200);
    const now = clock();
    const existing = readPackages();
    const topic = target
      ? replaceFiles(target, outcome.data, shownTitle, shownSummary, now)
      : createTopic(outcome.data, shownTitle, shownSummary, now, existing);
    const saved = target
      ? savePackages(existing.map((t) => (t.id === target.id ? topic : t)))
      : addPackage(topic);
    if (!saved) {
      savePackages(existing);
      setReading(false);
      setProblem(NO_ROOM);
      return;
    }
    router.push(`/instructor/content/package/${topic.id}`);
  }

  return (
    <PackageImportView
      outcome={outcome}
      title={shownTitle}
      summary={shownSummary}
      reading={reading}
      notice={
        target
          ? `${
              fixTab ? `${fixMessage(checkPackage(target), tabFrom(fixTab))} ` : ""
            }The new files replace the files of ${target.title}; the title is kept.`
          : ""
      }
      extraMessage={problem}
      onlyQuestions={onlyQuestions}
      questionsChoice={choice}
      onChoice={setChoice}
      onFiles={(chosen) => void choose(chosen)}
      onRemove={({ part, fileName }) =>
        setFiles((current) =>
          part === "images" && fileName === undefined
            ? current.filter((f) => fileKind(f.name) !== "image")
            : current.filter((f) => f.name !== fileName),
        )
      }
      onTitle={setTitle}
      onSummary={setSummary}
      onImport={() => void run()}
      onCancel={() =>
        router.push(target ? `/instructor/content/package/${target.id}` : "/instructor/content")
      }
    />
  );
}

export default function ImportContentPage() {
  // a page kept in the background keeps its state: when this screen is hidden (the effect is
  // cleaned up) the form is reset, so the next visit starts empty
  const [shown, setShown] = useState(0);
  useEffect(() => () => setShown((n) => n + 1), []);
  return (
    <Suspense fallback={null}>
      <Import key={shown} />
    </Suspense>
  );
}
