import {
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_PACKAGE_BYTES,
  extensionOf,
  IMAGE_EXTENSIONS,
} from "@/lib/package-read";
import type {
  GuideSection,
  PackageData,
  PackageImage,
  PackageQuestion,
  ScenarioStep,
  StepItem,
} from "@/lib/package-read";
import { parseKey } from "@/lib/package-review";

/** One item of a package as the edit screens change it. */
export type ItemDraft = GuideSection | StepItem | ScenarioStep | PackageQuestion;

/** The item a key points at (a copy), or null for a stale key. */
export function getItem(data: PackageData, key: string): ItemDraft | null {
  const ref = parseKey(data, key);
  if (!ref) return null;
  if (ref.part === "guide") return { ...data.guide![ref.index] };
  if (ref.part === "steps") return { ...data.steps![ref.list].steps[ref.index] };
  if (ref.part === "scenario") return { ...data.scenario![ref.index] };
  return { ...data.questions![ref.index] };
}

/** The package with that item replaced; the item keeps its place and nothing else changes. */
export function setItem<T extends PackageData>(data: T, key: string, item: ItemDraft): T {
  const ref = parseKey(data, key);
  if (!ref) return data;
  if (ref.part === "guide") {
    return {
      ...data,
      guide: data.guide!.map((entry, i) => (i === ref.index ? (item as GuideSection) : entry)),
    };
  }
  if (ref.part === "steps") {
    return {
      ...data,
      steps: data.steps!.map((list, li) =>
        li === ref.list
          ? {
              ...list,
              steps: list.steps.map((step, si) => (si === ref.index ? (item as StepItem) : step)),
            }
          : list,
      ),
    };
  }
  if (ref.part === "scenario") {
    return {
      ...data,
      scenario: data.scenario!.map((step, i) => (i === ref.index ? (item as ScenarioStep) : step)),
    };
  }
  return {
    ...data,
    questions: data.questions!.map((q, i) => (i === ref.index ? (item as PackageQuestion) : q)),
  };
}

/** Whether a picture may be added: its type and size, and the budget of the package. Null when fine. */
export function imageProblem(
  data: Pick<PackageData, "images">,
  file: { name: string; size: number },
): string | null {
  if (!IMAGE_EXTENSIONS.includes(extensionOf(file.name))) {
    return `${file.name} is not a png, jpg or webp picture.`;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} is larger than 300 KB.`;
  const others = Object.entries(data.images).filter(
    ([name]) => name.toLowerCase() !== file.name.toLowerCase(),
  );
  if (others.length >= MAX_IMAGES) {
    return `A package may hold ${MAX_IMAGES} pictures at most.`;
  }
  const total = others.reduce((sum, [, image]) => sum + image.size, 0) + file.size;
  if (total > MAX_PACKAGE_BYTES) return "The package would be larger than 1.5 MB.";
  return null;
}

/** The package with a picture added under its file name (replacing one of the same name). */
export function withImage<T extends PackageData>(data: T, name: string, image: PackageImage): T {
  const images = Object.fromEntries(
    Object.entries(data.images).filter(([key]) => key.toLowerCase() !== name.toLowerCase()),
  );
  return { ...data, images: { ...images, [name]: image } };
}

/** An item with its guide link confirmed: the automatic match no longer waits for "Mark as OK". */
export function confirmed<T extends ItemDraft>(item: T): T {
  return "refAuto" in item ? { ...item, refAuto: undefined } : item;
}
