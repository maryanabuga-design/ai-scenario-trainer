import floodBank from "@/content/question-bank-flood.json";
import bank from "@/content/quiz-bank.json";
import type { Item } from "@/lib/items";

type QuestionFile = Omit<Item, "kind">;

/** Every quiz question: 3 or 4 options (two for true or false), one correct, in guide order. */
export const questions: Item[] = [...bank.questions, ...floodBank.questions].map((question) => ({
  ...(question as QuestionFile),
  kind: "question" as const,
}));

export function getQuestion(id: string): Item {
  const question = questions.find((candidate) => candidate.id === id);
  if (!question) throw new Error(`Unknown question ${id}`);
  return question;
}

export function questionsFor(sections: string[]): Item[] {
  return questions.filter((question) => sections.includes(question.section));
}
