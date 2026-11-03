import type { Page } from "@playwright/test";
import { authValue } from "../auth-seed";

/** The day every visual and responsive check pretends it is, so "Due 9 Nov" and "in 3 days" are stable. */
export const FIXED_NOW = new Date(2026, 10, 3, 10, 0, 0);

export const PROFILE = JSON.stringify({ direction: "building-evacuation", onboarded: true });

/** Signs the browser in as the demo account of a role and fixes the clock. Call before the first goto. */
export async function prepare(page: Page, role: "student" | "instructor") {
  await page.clock.setFixedTime(FIXED_NOW);
  await page.addInitScript(
    ([auth, profile]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.auth.v1", auth);
      localStorage.setItem("ast.profile.v1", profile);
    },
    [authValue(role), PROFILE] as const,
  );
}

/** A question set of the instructor's own, so the Content screens have a topic. */
const SET = {
  id: "cvisual1",
  title: "Evacuation quick quiz",
  topic: "S2",
  status: "draft",
  source: "csv",
  fileName: "questions.csv",
  createdAt: FIXED_NOW.getTime(),
  dropped: 0,
  questions: [
    {
      id: "q1",
      text: "What is the safest way out?",
      options: ["The marked exit", "The lift", "Wait", ""],
      correct: "a",
      explanation: "The marked exit.",
      guideRef: "S2",
      imageUrl: "",
    },
  ],
};

/** A brand-new exam (no attempts) assigned to the Rescue team. */
const NEW_EXAM = {
  id: "grp-visual-1",
  title: "Exam: Alarm and escape routes",
  topicIds: ["S1", "S2"],
  groupIds: ["rescue-team"],
  attemptsAllowed: 3,
  questionCount: 20,
  timeLimit: 20,
  passMark: 80,
  deadline: "2026-11-10",
  createdAt: FIXED_NOW.getTime(),
  createdBy: "Instructor",
};

async function seedKeys(page: Page, entries: Record<string, unknown>) {
  await page.addInitScript((data) => {
    for (const [key, value] of Object.entries(data as Record<string, unknown>))
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, entries);
}

/** A practice session of five quiz questions, in the state a student reaches by answering. */
const quizIds = [
  "q-quiz-s01-001",
  "q-quiz-s01-002",
  "q-quiz-s01-003",
  "q-quiz-s01-004",
  "q-quiz-s01-005",
];
const session = (
  finished: boolean,
  answers: { itemId: string; optionId: string; checked?: boolean }[],
) => ({
  schema: 2,
  value: {
    kind: "quiz",
    itemIds: quizIds,
    answers,
    index: 0,
    finished,
    finishedAt: FIXED_NOW.getTime(),
    returnTo: "/materials/read/S1",
  },
});

export type Route = {
  name: string;
  role: "student" | "instructor";
  path: string;
  /** Seeds, clicks or typing needed before the picture is taken. */
  setup?: (page: Page) => Promise<void>;
  /** Clicks or typing after the page has loaded. */
  after?: (page: Page) => Promise<void>;
  /** Something that must be on screen when the page is ready. */
  ready?: string;
};

const instructor = (name: string, path: string, extra: Partial<Route> = {}): Route => ({
  name: `instructor-${name}`,
  role: "instructor",
  path,
  ...extra,
});
const student = (name: string, path: string, extra: Partial<Route> = {}): Route => ({
  name: `student-${name}`,
  role: "student",
  path,
  ...extra,
});

const withSet = (page: Page) =>
  seedKeys(page, { "ast.content-sets.v1": { schema: 6, value: [SET] } });
const withNewExam = (page: Page) =>
  seedKeys(page, { "ast.group-exams.v1": { schema: 6, value: [NEW_EXAM] } });

export const routes: Route[] = [
  instructor("overview", "/instructor", { ready: "[data-weakest-topic]" }),
  instructor("exams-list", "/instructor/exams", { ready: "[data-exam-card]" }),
  instructor("exam-active", "/instructor/exams/seed-active", { ready: "[data-tried]" }),
  instructor("exam-closed", "/instructor/exams/seed-closed", { ready: "[data-specs]" }),
  instructor("exam-new-no-results", "/instructor/exams/grp-visual-1", {
    setup: withNewExam,
    ready: "[data-no-results]",
  }),
  instructor("exams-list-new", "/instructor/exams", {
    setup: withNewExam,
    ready: "[data-exam-card]",
  }),
  instructor("exam-assign", "/instructor/exams/new"),
  instructor("exam-extend", "/instructor/exams/seed-active/extend"),
  instructor("exam-question", "/instructor/exams/seed-closed/questions/1"),
  instructor("students", "/instructor/students", {
    ready: "[data-student]:visible, [data-table-link]:visible",
  }),
  instructor("students-topics", "/instructor/students?view=topics", { ready: "[data-topic-card]" }),
  instructor("students-no-results", "/instructor/students", {
    ready: "[data-student]:visible, [data-table-link]:visible",
    after: async (page) => {
      await page.getByPlaceholder("Search students").fill("Zimmerman");
      await page.locator('[data-empty="search"]').waitFor();
    },
  }),
  instructor("students-invite", "/instructor/students/invite"),
  instructor("student-detail", "/instructor/students/stu-01"),
  instructor("student-detail-no-practice", "/instructor/students/stu-06", {
    ready: "[data-student-header]",
  }),
  instructor("topic-students", "/instructor/students/topic/S1"),
  instructor("content-empty", "/instructor/content", { ready: "[data-empty-picture]" }),
  instructor("content-with-topic", "/instructor/content", {
    setup: withSet,
    ready: "[data-set-card]",
  }),
  instructor("content-course", "/instructor/content/course"),
  instructor("content-built-in", "/instructor/content/built-in/S1"),
  instructor("content-set-review", "/instructor/content/cvisual1", { setup: withSet }),
  instructor("content-question-edit", "/instructor/content/cvisual1/1", { setup: withSet }),
  instructor("content-import", "/instructor/content/import"),
  instructor("content-import-questions", "/instructor/content/import/questions"),
  instructor("content-import-result", "/instructor/content/import", {
    after: async (page) => {
      await page.getByRole("button", { name: "Try an example" }).click();
      await page.getByRole("button", { name: /^Import/ }).click();
      await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 45_000 });
    },
  }),
  instructor("profile", "/profile"),
  student("home", "/"),
  student("materials", "/materials", { ready: "[role=radiogroup]" }),
  student("materials-steps", "/materials?view=steps", { ready: "[data-step-guide]" }),
  student("reading", "/materials/read/S1"),
  student("progress", "/progress"),
  student("ask-ai", "/ask-ai", { ready: "[data-suggested]" }),
  student("training", "/training"),
  student("training-quiz", "/training?mode=quiz"),
  student("exam", "/exam"),
  student("notifications", "/notifications"),
  student("profile", "/profile"),
  student("saved", "/saved"),
  student("weak-topics", "/weak-topics"),
  student("step-guides", "/checklists"),
  student("mini-quiz", "/mini-quiz"),
  student("quiz-question", "/session", {
    setup: (page) => seedKeys(page, { "ast.session.v1": session(false, []) }),
    ready: "fieldset input",
  }),
  student("quiz-feedback", "/session", {
    setup: (page) =>
      seedKeys(page, {
        "ast.session.v1": session(false, [{ itemId: quizIds[0], optionId: "a", checked: true }]),
      }),
    ready: "[data-bottom-sheet=feedback]",
  }),
  student("quiz-hint", "/session", {
    setup: (page) =>
      seedKeys(page, { "ast.session.v1": session(false, [{ itemId: quizIds[0], optionId: "a" }]) }),
    ready: "fieldset input",
    after: async (page) => {
      await page.getByRole("button", { name: "Hint", exact: true }).click();
      await page.locator("[data-bottom-sheet=hint]").waitFor();
    },
  }),
  student("quiz-results", "/session/results", {
    setup: (page) =>
      seedKeys(page, {
        "ast.session.v1": session(
          true,
          quizIds.map((itemId, n) => ({ itemId, optionId: n < 3 ? "c" : "a", checked: true })),
        ),
      }),
    ready: ".type-score",
  }),
];
