import data from "@/content/materials.json";
import { createStore } from "@/lib/store";

export type MaterialStatus = "ready" | "processing" | "failed";

export type MaterialSection = { id: string; title: string; excerpt: string };

export type Material = {
  id: string;
  name: string;
  type: string;
  size: string;
  /** ISO date, for example 2026-10-07. */
  added: string;
  status: MaterialStatus;
  hasScenario: boolean;
  /** "guide" means the sections come from the sample guide. */
  sectionsFrom?: "guide";
  sections?: MaterialSection[];
  progress?: number;
  reason?: string;
  uploaded?: boolean;
};

export const sampleMaterials = data as Material[];

const uploadsStore = createStore<Material[]>("ast.uploads.v1");
export const useUploads = uploadsStore.useValue;

export function addUpload(material: Material) {
  uploadsStore.write([material, ...(uploadsStore.read() ?? [])]);
}

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const typeNames: Record<string, string> = {
  pdf: "PDF",
  doc: "Word document",
  docx: "Word document",
  odt: "Text document",
  rtf: "Text document",
  txt: "Text file",
  md: "Text file",
};

const imageTypes = ["jpg", "jpeg", "png", "gif", "heic", "webp", "tif", "tiff", "bmp"];

function extension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type UploadOutcome =
  { status: "ready"; type: string } | { status: "failed"; type: string; reason: string };

/**
 * Simulated processing: only the file's name and size are used, never its content.
 * Images and scans have no readable text, files over 20 MB are too large, and other
 * types are not supported. Everything else becomes ready.
 */
export function simulateUpload(file: { name: string; size: number }): UploadOutcome {
  const ext = extension(file.name);
  if (imageTypes.includes(ext)) {
    return {
      status: "failed",
      type: "Image",
      reason:
        "This looks like an image or a scan, with no readable text. Try a PDF with selectable text, or a Word document.",
    };
  }
  const type = typeNames[ext];
  if (!type) {
    return {
      status: "failed",
      type: ext ? ext.toUpperCase() : "Unknown",
      reason: "This file type is not supported. Use a PDF, a Word document or a text file.",
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { status: "failed", type, reason: "The file is larger than 20 MB. Try a smaller file." };
  }
  return { status: "ready", type };
}

export function materialFromUpload(
  file: { name: string; size: number },
  outcome: UploadOutcome,
  now: Date,
): Material {
  return {
    id: `upload-${now.getTime()}`,
    name: file.name,
    type: outcome.type,
    size: formatSize(file.size),
    added: now.toISOString().slice(0, 10),
    status: outcome.status,
    hasScenario: false,
    reason: outcome.status === "failed" ? outcome.reason : undefined,
    uploaded: true,
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatAdded(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate}T12:00:00`));
}
