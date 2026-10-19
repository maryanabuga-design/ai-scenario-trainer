import { beforeEach, describe, expect, it, vi } from "vitest";
import { SCHEMA_VERSION } from "@/lib/store";
import { contentFingerprint } from "@/lib/content-version";

async function load() {
  vi.resetModules();
  return import("@/lib/assigned-exams");
}

function stubStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  return data;
}

const NOW = new Date(2026, 9, 19, 10, 0);

describe("assigned exams", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("seeds the demo exam once: S1 to S4, due in 7 days, assigned by Instructor", async () => {
    const data = stubStorage();
    const exams = await load();
    const seeded = exams.seedExams(NOW);
    expect(seeded).toHaveLength(1);
    expect(seeded[0]).toMatchObject({
      id: "demo-evacuation-basics",
      title: "Evacuation basics exam",
      topicIds: ["S1", "S2", "S3", "S4"],
      deadline: "2026-10-26",
      assignedBy: "Instructor",
    });
    expect(data.has("ast.exams.v1")).toBe(true);
    // a second load keeps what is stored and does not seed again
    const again = exams.seedExams(new Date(2026, 9, 30));
    expect(again[0].deadline).toBe("2026-10-26");
  });

  it("cleans what it reads: unknown topics dropped, broken entries ignored, never a crash", async () => {
    const { cleanExams } = await load();
    const good = {
      id: "a",
      title: "Exam A",
      topicIds: ["S2", "ghost", "S1"],
      deadline: "2026-10-25",
      assignedBy: "Instructor",
      assignedAt: 5,
    };
    expect(cleanExams([good])![0].topicIds).toEqual(["S1", "S2"]);
    expect(
      cleanExams([good, { id: "b" }, null, 7, "x", { ...good, id: "c", deadline: "soon" }]),
    ).toHaveLength(1);
    expect(cleanExams([{ ...good, topicIds: ["ghost"] }])).toBeNull();
    expect(cleanExams([{ ...good, title: "  " }])).toBeNull();
    for (const broken of [null, undefined, 5, "x", {}, [], [[]]]) {
      expect(cleanExams(broken)).toBeNull();
    }
  });

  it("reads old, corrupted or other-version saved data as nothing and then seeds", async () => {
    for (const raw of [
      "{broken",
      JSON.stringify({ schema: 99, value: [] }),
      JSON.stringify([1, 2]),
    ]) {
      const data = stubStorage({ "ast.exams.v1": raw });
      const exams = await load();
      expect(exams.readExams()).toBeNull();
      const seeded = exams.seedExams(NOW);
      expect(seeded[0].id).toBe("demo-evacuation-basics");
      expect(JSON.parse(data.get("ast.exams.v1")!).schema).toBe(SCHEMA_VERSION);
      vi.unstubAllGlobals();
    }
  });

  it("drops unknown topics from valid saved data written for other content", async () => {
    const saved = {
      schema: SCHEMA_VERSION,
      content: `${contentFingerprint}-old`,
      value: [
        {
          id: "a",
          title: "Old exam",
          topicIds: ["S1", "S99"],
          deadline: "2026-10-25",
          assignedBy: "Instructor",
          assignedAt: 1,
        },
      ],
    };
    stubStorage({ "ast.exams.v1": JSON.stringify(saved) });
    const exams = await load();
    expect(exams.readExams()![0].topicIds).toEqual(["S1"]);
  });

  it("sorts by the nearest deadline", async () => {
    const { byDeadline, nearestExam, demoExam } = await load();
    const a = { ...demoExam(NOW), id: "a", deadline: "2026-10-30" };
    const b = { ...demoExam(NOW), id: "b", deadline: "2026-10-22" };
    const c = { ...demoExam(NOW), id: "c", deadline: "2026-10-22", assignedAt: NOW.getTime() + 5 };
    expect(byDeadline([a, c, b]).map((exam) => exam.id)).toEqual(["b", "c", "a"]);
    expect(nearestExam([a, b])?.id).toBe("b");
    expect(nearestExam([])).toBeNull();
  });
});

describe("the Instructor wording", () => {
  it("shows an exam saved before the rename as assigned by Instructor", async () => {
    const { cleanExams } = await load();
    const old = {
      id: "a",
      title: "Old exam",
      topicIds: ["S1"],
      deadline: "2026-10-25",
      assignedBy: "Admin",
      assignedAt: 1,
    };
    expect(cleanExams([old])![0].assignedBy).toBe("Instructor");
    expect(cleanExams([{ ...old, assignedBy: undefined }])![0].assignedBy).toBe("Instructor");
  });
});
