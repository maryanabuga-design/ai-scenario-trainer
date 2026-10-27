"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PackageImportView } from "@/components/InstructorContent/PackageImportView";
import { clearDocumentDraft, setDocumentDraft } from "@/lib/document-draft";
import { checkDocument, checkFile } from "@/lib/document-read";
import { MAX_IMAGES, MAX_IMAGE_BYTES, fileKind } from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";
import { usePackages } from "@/lib/packages";

const SAMPLE = "/templates/sample-document.xlsx";
const SAMPLE_IMAGES = ["exit-sign.png", "assembly-point.png"];

const readUrl = (file: File) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

type Chosen = { name: string; size: number; bytes: Uint8Array | null };

function Import() {
  const router = useRouter();
  const query = useSearchParams();
  const replaceId = query.get("replace");
  const topics = usePackages();
  const [file, setFile] = useState<Chosen | null>(null);
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<PackageFile[]>([]);
  const [imageMessage, setImageMessage] = useState("");
  if (topics === "loading") return null;
  const target = replaceId ? topics.find((t) => t.id === replaceId) : undefined;

  /** A chosen file: the type and size first, then whether it has a Guide sheet. */
  async function choose(chosen: File) {
    setImageMessage("");
    const blocked = checkFile(chosen.name, chosen.size);
    if (blocked) {
      setFile({ name: chosen.name, size: chosen.size, bytes: null });
      setMessage(blocked);
      return;
    }
    const bytes = new Uint8Array(await chosen.arrayBuffer());
    setFile({ name: chosen.name, size: chosen.size, bytes });
    // a file that looks like Excel but cannot be opened is not blocked here: the analysis says so
    setMessage(checkDocument(bytes) ?? "");
  }

  async function addImages(chosen: File[]) {
    const next = [...images];
    let problem = "";
    for (const picture of chosen) {
      if (fileKind(picture.name) !== "image")
        problem = `${picture.name} is not a png, jpg or webp picture.`;
      else if (picture.size > MAX_IMAGE_BYTES) problem = `${picture.name} is larger than 300 KB.`;
      else if (next.length >= MAX_IMAGES && !next.some((i) => i.name === picture.name))
        problem = `Add at most ${MAX_IMAGES} images.`;
      else {
        const entry = { name: picture.name, size: picture.size, dataUrl: await readUrl(picture) };
        const at = next.findIndex((i) => i.name === picture.name);
        if (at >= 0) next[at] = entry;
        else next.push(entry);
      }
    }
    setImages(next);
    setImageMessage(problem);
  }

  async function sample() {
    try {
      const [sheet, ...pictures] = await Promise.all(
        [SAMPLE, ...SAMPLE_IMAGES.map((n) => `/templates/sample-package/${n}`)].map((url) =>
          fetch(url),
        ),
      );
      const bytes = new Uint8Array(await sheet.arrayBuffer());
      const files: PackageFile[] = await Promise.all(
        pictures.map(async (response, i) => {
          const blob = await response.blob();
          return {
            name: SAMPLE_IMAGES[i],
            size: blob.size,
            dataUrl: await readUrl(new File([blob], SAMPLE_IMAGES[i])),
          };
        }),
      );
      setFile({ name: "sample-document.xlsx", size: bytes.length, bytes });
      setImages(files);
      setImageMessage("");
      setMessage(checkDocument(bytes) ?? "");
    } catch {
      setMessage("The sample document could not be loaded. Try again.");
    }
  }

  function start() {
    if (!file?.bytes || message) return;
    setDocumentDraft({ name: file.name, size: file.size, bytes: file.bytes, images });
    router.push(`/instructor/content/import/analysing${target ? `?replace=${target.id}` : ""}`);
  }

  return (
    <PackageImportView
      file={file}
      message={message}
      images={images.map((i) => i.name)}
      imageMessage={imageMessage}
      notice={
        target ? `The new document replaces the content of ${target.title}. The title is kept.` : ""
      }
      onFile={(chosen) => void choose(chosen)}
      onRemove={() => {
        clearDocumentDraft();
        setFile(null);
        setMessage("");
        setImages([]);
        setImageMessage("");
      }}
      onSample={() => void sample()}
      onImages={(chosen) => void addImages(chosen)}
      onImport={start}
      onCancel={() => {
        clearDocumentDraft();
        router.push(target ? `/instructor/content/package/${target.id}` : "/instructor/content");
      }}
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
