import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  MAX_PACKAGES,
  cleanPackages,
  createTopic,
  editedText,
  nextCode,
  publishedPackages,
  replaceFiles,
} from "@/lib/packages";
import type { DemoTopic } from "@/lib/packages";
import { readPackage } from "@/lib/package-read";
import type { PackageFile } from "@/lib/package-read";
import { allTopicIds } from "@/lib/progress-view";
import { trainingSections } from "@/lib/parts";
import { topicQuestionCount } from "@/lib/group-exams";

const DIR = "public/templates/sample-package";
const sample = (name: string): PackageFile => {
  const bytes = readFileSync(`${DIR}/${name}`);
  return name.endsWith(".png")
    ? { name, size: bytes.length, dataUrl: `data:image/png;base64,${bytes.toString("base64")}` }
    : { name, size: bytes.length, text: bytes.toString("utf8") };
};
const whole = () =>
  readPackage(
    [
      "topic.csv",
      "guide.csv",
      "steps.csv",
      "scenario.csv",
      "questions.csv",
      "exit-sign.png",
      "assembly-point.png",
    ].map(sample),
  ).data;
const NOW = new Date(2026, 9, 31, 10, 0).getTime();

describe("demo topics in storage", () => {
  it("creates a draft with the next free code (N1, N2, ...) from what was read", () => {
    const first = createTopic(whole(), "  Evacuating a crowded hall ", "Summary", NOW, []);
    expect(first).toMatchObject({
      code: "N1",
      status: "draft",
      title: "Evacuating a crowded hall",
      createdAt: NOW,
    });
    expect(nextCode([first])).toBe("N2");
    expect(nextCode([{ ...first, code: "N2" }])).toBe("N1");
    expect(first.id).toMatch(/^pk/);
  });

  it("replaces the files of a topic but keeps its id, code and creation, and returns it to draft", () => {
    const first = { ...createTopic(whole(), "T", "", NOW, []), status: "published" as const };
    const next = replaceFiles(first, whole(), "Kept title", "s", NOW + 5);
    expect(next).toMatchObject({
      id: first.id,
      code: "N1",
      status: "draft",
      title: "Kept title",
      createdAt: NOW,
      editedAt: NOW + 5,
    });
  });

  it("lists only the published topics for students", () => {
    const a = createTopic(whole(), "A", "", NOW, []);
    const b = { ...createTopic(whole(), "B", "", NOW + 1, [a]), status: "published" as const };
    expect(publishedPackages([a, b]).map((t) => t.title)).toEqual(["B"]);
  });

  it("loads tolerantly: nothing throws, a broken topic is dropped, unknown codes and titles are refused", () => {
    expect(cleanPackages(null)).toBeNull();
    expect(cleanPackages("nope")).toBeNull();
    const good = createTopic(whole(), "Good", "", NOW, []);
    const loaded = cleanPackages([
      good,
      { ...good, id: "x", code: "S1" },
      { ...good, id: "y", code: "N9", title: "  " },
      { ...good, id: "z", code: "N3", guide: "broken", steps: [1, null, { title: 3 }], images: 7 },
      "junk",
      { ...good, id: good.id },
    ])!;
    expect(loaded.map((t) => t.code)).toEqual(["N1", "N3"]);
    expect(loaded[1].guide).toBeNull();
    expect(loaded[1].steps).toEqual([{ title: "", steps: [] }]);
    expect(loaded[1].images).toEqual({});
  });

  it("keeps at most 5 topics, pictures within the budget (300 KB each, 6 pictures, 1.5 MB), and only picture data URLs", () => {
    const base = createTopic(whole(), "T", "", NOW, []);
    const many = Array.from({ length: 8 }, (_, i) => ({ ...base, id: `p${i}`, code: `N${i + 1}` }));
    expect(cleanPackages(many)).toHaveLength(MAX_PACKAGES);
    const images = {
      "a.png": { data: "data:image/png;base64,AA", size: 100 },
      "big.png": { data: "data:image/png;base64,AA", size: 400 * 1024 },
      "script.png": { data: "javascript:alert(1)", size: 10 },
      "doc.pdf": { data: "data:image/png;base64,AA", size: 10 },
    };
    expect(Object.keys(cleanPackages([{ ...base, images }])![0].images)).toEqual(["a.png"]);
    const heavy = Object.fromEntries(
      Array.from({ length: 6 }, (_, i) => [
        `h${i}.png`,
        { data: "data:image/png;base64,AA", size: 290 * 1024 },
      ]),
    );
    expect(Object.keys(cleanPackages([{ ...base, images: heavy }])![0].images)).toHaveLength(5);
  });

  it("says 'today' for a topic edited today", () => {
    expect(editedText(NOW, NOW + 3600_000)).toBe("today");
    expect(editedText(NOW, NOW + 3 * 86_400_000)).toBe("31 Oct");
  });
});

describe("a demo topic is isolated from the rest of the app", () => {
  const libFiles = readdirSync("lib").filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

  it("is imported by no module of readiness, Progress, exams, Assign exam, Weakest topics, Hardest questions, Ask AI or the built-in content", () => {
    const allowed = new Set([
      "packages.ts",
      "package-read.ts",
      "package-student.ts",
      "package-edit.ts",
      "package-review.ts",
    ]);
    const importers = libFiles.filter((file) => {
      if (allowed.has(file)) return false;
      const code = readFileSync(`lib/${file}`, "utf8");
      return /@\/lib\/packages?(-read)?["']/.test(code);
    });
    expect(importers).toEqual([]);
  });

  it("is imported only by the Content screens, the demo-topic screens and the student Materials section", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) return walk(path);
        return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
      });
    const users = [...walk("components"), ...walk("app")].filter((path) =>
      /@\/lib\/packages?(-read)?["']/.test(readFileSync(path, "utf8")),
    );
    const outside = users.filter(
      (path) =>
        !/PackageContent|InstructorContent|MaterialsTopics\/FromInstructor|app\/\(app\)\/(instructor\/content|materials\/package)|app\/screens|package-student/.test(
          path,
        ),
    );
    expect(outside).toEqual([]);
  });

  it("writes only its own key and none of the progress, history, exam or notification stores", () => {
    const code = readFileSync("lib/packages.ts", "utf8");
    expect(code.match(/createStore<[^>]*>\(\s*"([^"]+)"/g)).toHaveLength(1);
    expect(code).toContain('"ast.demo-topics.v1"');
    // the student screens of a demo topic (also the preview) import none of the stores that save
    for (const file of [
      "components/PackageContent/PackageStudentScreen.tsx",
      "components/PackageContent/PackageStudentRoute.tsx",
      "lib/package-student.ts",
    ]) {
      const code = readFileSync(file, "utf8");
      for (const store of [
        "@/lib/session",
        "@/lib/progress",
        "@/lib/exam-store",
        "@/lib/store",
        "@/lib/saved",
        "@/lib/notifications",
        "@/lib/highlight-store",
        "@/lib/part-progress",
      ]) {
        expect(code, `${file} ${store}`).not.toContain(store);
      }
    }
  });

  it("has a code (N1, N2, ...) that is none of the built-in topics, with no questions, readiness or topic count", () => {
    for (const code of ["N1", "N2", "N9"]) {
      expect(trainingSections).not.toContain(code);
      expect(allTopicIds).not.toContain(code);
      expect(topicQuestionCount(code)).toBe(0);
    }
    expect(trainingSections).toHaveLength(10);
  });

  it("does not make the package questions findable as built-in items", async () => {
    const { findItem } = await import("@/lib/items");
    const topic: DemoTopic = createTopic(whole(), "T", "", NOW, []);
    for (const q of topic.questions!) expect(findItem(q.id)).toBeUndefined();
  });
});
