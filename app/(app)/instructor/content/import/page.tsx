"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImportView } from "@/components/InstructorContent/ImportView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { detectTopic, isRead, readCsv, sampleQuestions } from "@/lib/content-import";
import { NO_ROOM, addSet, newSetId, removeSet } from "@/lib/content-sets";
import type { ContentSet } from "@/lib/content-sets";
import {
  chooseDraftFile,
  clearDraft,
  draftTopic,
  removeDraftFile,
  updateDraft,
  useImportDraft,
} from "@/lib/import-draft";

/** The text of a file, read on this device (nothing is sent anywhere). */
const readText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export default function ImportPage() {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const draft = useImportDraft();
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  async function choose(file: File) {
    setError("");
    let detected: string | null = null;
    if (isRead(file.name)) {
      try {
        detected = detectTopic(await readText(file));
      } catch {
        detected = null;
      }
    }
    chooseDraftFile(file, detected);
  }

  async function read() {
    const { file, title } = draft;
    const topic = draftTopic(draft);
    if (!file || !topic || title.trim() === "") return;
    setError("");
    setReading(true);
    const now = Date.now();
    const id = newSetId(now);
    let questions: ContentSet["questions"];
    let dropped = 0;
    const source = isRead(file.name) ? "csv" : "sample";
    if (source === "sample") {
      questions = sampleQuestions(id);
    } else {
      let result;
      try {
        result = readCsv(await readText(file), id);
      } catch {
        result = { ok: false as const, error: "The file could not be read." };
      }
      if (!result.ok) {
        setReading(false);
        setError(result.error);
        return;
      }
      questions = result.questions;
      dropped = result.dropped;
    }
    await pause(1200);
    const set: ContentSet = {
      id,
      title: title.trim(),
      topic,
      status: "draft",
      source,
      fileName: file.name,
      createdAt: now,
      dropped,
      questions,
    };
    if (!addSet(set)) {
      removeSet(id);
      setReading(false);
      setError(NO_ROOM);
      return;
    }
    clearDraft();
    router.push(`/instructor/content/${id}`);
  }

  return (
    <ImportView
      draft={{
        title: draft.title,
        topic: draft.topic,
        detected: draft.detected,
        file: draft.file ? { name: draft.file.name, size: draft.file.size } : null,
      }}
      topicTitle={titleOf}
      reading={reading}
      readError={error}
      onFile={(file) => void choose(file)}
      onRemoveFile={removeDraftFile}
      onTitle={(title) => updateDraft({ title, titleEdited: true })}
      onImport={() => void read()}
      onCancel={() => {
        clearDraft();
        router.push("/instructor/content");
      }}
    />
  );
}
