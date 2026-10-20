"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImportView } from "@/components/InstructorContent/ImportView";
import type { ImportValues } from "@/components/InstructorContent/ImportView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { fileTypeOf, readCsv, sampleQuestions } from "@/lib/content-import";
import { NO_ROOM, addSet, newSetId, removeSet } from "@/lib/content-sets";
import type { ContentSet } from "@/lib/content-sets";

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
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const titleOf = (id: string) => sections.find((section) => section.id === id)?.title ?? id;

  async function read({ title, topic, file }: ImportValues) {
    setError("");
    setReading(true);
    const now = Date.now();
    const id = newSetId(now);
    let questions: ContentSet["questions"];
    let dropped = 0;
    const source = fileTypeOf(file.name) === "docx" ? "sample" : "csv";
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
      title,
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
    router.push(`/instructor/content/${id}`);
  }

  return (
    <ImportView
      titleOf={titleOf}
      reading={reading}
      readError={error}
      onRead={(values) => void read(values)}
      onCancel={() => router.push("/instructor/content")}
    />
  );
}
