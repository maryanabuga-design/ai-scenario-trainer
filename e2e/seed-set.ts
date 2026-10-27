import type { Page } from "@playwright/test";

export type SeedQuestion = {
  id: string;
  text: string;
  options: [string, string, string, string];
  correct: string | null;
  explanation: string;
  guideRef: string;
  imageUrl: string;
};

/**
 * Puts an earlier question set into this browser. The screen that created them is retired (one
 * document creates one topic), but sets already saved keep working, so the specs of their Review,
 * Edit and Training screens start from a saved set. Opens the Content page first for the origin.
 */
export async function seedSet(
  page: Page,
  set: { title: string; topic?: string; status?: "draft" | "published"; questions: SeedQuestion[] },
): Promise<string> {
  const id = `cseed${Math.random().toString(36).slice(2, 8)}`;
  await page.goto("/instructor/content");
  await page.evaluate(
    ({ id, set }) => {
      const key = "ast.content-sets.v1";
      let value: unknown[] = [];
      try {
        value = JSON.parse(localStorage.getItem(key) ?? "{}").value ?? [];
      } catch {
        value = [];
      }
      const status = set.status ?? "draft";
      value.push({
        id,
        title: set.title,
        topic: set.topic ?? "S3",
        status,
        source: "csv",
        fileName: "questions.csv",
        createdAt: Date.now(),
        ...(status === "published" && { publishedAt: Date.now() }),
        dropped: 0,
        questions: set.questions,
      });
      localStorage.setItem(key, JSON.stringify({ schema: 6, value }));
    },
    { id, set },
  );
  return id;
}
