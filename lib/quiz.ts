import floodBank from "@/content/question-bank-flood.json";
import bank from "@/content/quiz-bank.json";
import type { Confidence } from "@/lib/scenario";
import { errorType } from "@/lib/scoring";
import type { ScoredItem } from "@/lib/scoring";

type Base = { id: string; section: string; question: string; why: string; misconception: string };
export type Choice = { id: string; text: string };

export type SingleQuestion = Base & { type: "single"; options: Choice[]; answer: string };
export type MultipleQuestion = Base & { type: "multiple"; options: Choice[]; answer: string[] };
export type OrderingQuestion = Base & { type: "ordering"; items: Choice[]; answer: string[] };
export type TextQuestion = Base & {
  type: "text";
  /** Accepted phrases; or, with minimumMatches, keywords of which that many must appear. */
  accepted: string[];
  minimumMatches?: number;
  answerText: string;
  placeholder: string;
};
export type TrueFalseQuestion = Base & { type: "truefalse"; answer: boolean };

export type Question =
  SingleQuestion | MultipleQuestion | OrderingQuestion | TextQuestion | TrueFalseQuestion;

export type Response =
  | { type: "single"; optionId: string }
  | { type: "multiple"; optionIds: string[] }
  | { type: "ordering"; order: string[] }
  | { type: "text"; text: string }
  | { type: "truefalse"; value: boolean };

type FloodQuestion = {
  id: string;
  type: "single" | "multiple" | "trueFalse" | "ordering" | "text";
  section: string;
  prompt: string;
  options?: Choice[];
  items?: Choice[];
  correct?: (string | boolean)[];
  correctOrder?: string[];
  acceptedKeywords?: string[];
  minimumMatches?: number;
  referenceAnswer?: string;
  why: string;
  misconception: string;
};

/** Moves every item to a new place (a rotation), so an ordering never starts already solved. */
function scramble<T>(list: T[]): T[] {
  const shift = Math.ceil(list.length / 2);
  return [...list.slice(shift), ...list.slice(0, shift)];
}

/**
 * The flood question bank uses its own format (prompt, correct arrays, trueFalse, correctOrder,
 * acceptedKeywords). Ids get a "flood-" prefix so they never clash with the guide's questions.
 */
function fromFloodBank(question: FloodQuestion): Question {
  const base = {
    id: `flood-${question.id}`,
    section: question.section,
    question: question.prompt,
    why: question.why,
    misconception: question.misconception,
  };
  switch (question.type) {
    case "single":
      return {
        ...base,
        type: "single",
        options: question.options ?? [],
        answer: String(question.correct?.[0]),
      };
    case "multiple":
      return {
        ...base,
        type: "multiple",
        options: question.options ?? [],
        answer: (question.correct ?? []).map(String),
      };
    case "trueFalse":
      return { ...base, type: "truefalse", answer: question.correct?.[0] === true };
    case "ordering":
      return {
        ...base,
        type: "ordering",
        items: scramble(question.items ?? []),
        answer: question.correctOrder ?? [],
      };
    case "text":
      return {
        ...base,
        type: "text",
        accepted: question.acceptedKeywords ?? [],
        minimumMatches: question.minimumMatches ?? 1,
        answerText: question.referenceAnswer ?? "",
        placeholder: "One sentence",
      };
  }
}

export const questions: Question[] = [
  ...(bank.questions as Question[]),
  ...(floodBank.questions as FloodQuestion[]).map(fromFloodBank),
];

export const quizCounts = [5, 10, 15] as const;

export function getQuestion(id: string): Question {
  const question = questions.find((candidate) => candidate.id === id);
  if (!question) throw new Error(`Unknown question ${id}`);
  return question;
}

export function questionsFor(sections: string[]): Question[] {
  return questions.filter((question) => sections.includes(question.section));
}

/**
 * Picks the questions for a quiz: shuffled within each section, then taken in turns
 * from each chosen section so a short quiz still covers them all.
 */
export function pickQuestions(sections: string[], count: number, random = Math.random): string[] {
  const shuffle = <T>(list: T[]) =>
    list
      .map((item) => ({ item, key: random() }))
      .sort((a, b) => a.key - b.key)
      .map(({ item }) => item);
  const bySection = sections.map((section) =>
    shuffle(questions.filter((question) => question.section === section)),
  );
  const picked: string[] = [];
  for (
    let round = 0;
    picked.length < count && bySection.some((list) => list.length > round);
    round++
  ) {
    for (const list of bySection) {
      if (list[round] && picked.length < count) picked.push(list[round].id);
    }
  }
  return shuffle(picked);
}

/** Lowercase words without punctuation, with a simple plural "s" removed. */
function words(text: string) {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).map((word) =>
    word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word,
  );
}

/**
 * Simulated check of a short text answer: it is accepted when it contains one of the accepted
 * phrases, or every word of one of them in any order. Case, punctuation and plurals do not matter.
 */
export function matchesText(accepted: string[], answer: string): boolean {
  const given = words(answer);
  if (given.length === 0) return false;
  const joined = ` ${given.join(" ")} `;
  return accepted.some((phrase) => {
    const needed = words(phrase);
    if (needed.length === 0) return false;
    return joined.includes(` ${needed.join(" ")} `) || needed.every((word) => given.includes(word));
  });
}

/**
 * Points from 0 to 1. Multiple choice: right picks minus wrong picks, over the number of right
 * options. Ordering: share of items in the right place.
 */
/** Keyword mode for short text: at least `minimum` of the keywords appear in the answer. */
export function matchesKeywords(keywords: string[], minimum: number, answer: string): boolean {
  const matched = keywords.filter((keyword) => matchesText([keyword], answer)).length;
  return words(answer).length > 0 && matched >= minimum;
}

export function scoreResponse(question: Question, response: Response): number {
  switch (question.type) {
    case "single":
      return response.type === "single" && response.optionId === question.answer ? 1 : 0;
    case "truefalse":
      return response.type === "truefalse" && response.value === question.answer ? 1 : 0;
    case "text":
      if (response.type !== "text") return 0;
      return (
        question.minimumMatches === undefined
          ? matchesText(question.accepted, response.text)
          : matchesKeywords(question.accepted, question.minimumMatches, response.text)
      )
        ? 1
        : 0;
    case "multiple": {
      if (response.type !== "multiple") return 0;
      const right = response.optionIds.filter((id) => question.answer.includes(id)).length;
      const wrong = response.optionIds.length - right;
      return Math.max(0, (right - wrong) / question.answer.length);
    }
    case "ordering": {
      if (response.type !== "ordering") return 0;
      const inPlace = question.answer.filter((id, index) => response.order[index] === id).length;
      return inPlace / question.answer.length;
    }
  }
}

function choiceText(choices: Choice[], ids: string[]) {
  return ids.map((id) => choices.find((choice) => choice.id === id)?.text ?? id).join("; ");
}

export function describeResponse(question: Question, response: Response): string {
  switch (response.type) {
    case "single":
      return question.type === "single" ? choiceText(question.options, [response.optionId]) : "";
    case "multiple":
      return question.type === "multiple" ? choiceText(question.options, response.optionIds) : "";
    case "ordering":
      return question.type === "ordering" ? choiceText(question.items, response.order) : "";
    case "text":
      return response.text;
    case "truefalse":
      return response.value ? "True" : "False";
  }
}

export function describeAnswer(question: Question): string {
  switch (question.type) {
    case "single":
      return choiceText(question.options, [question.answer]);
    case "multiple":
      return choiceText(question.options, question.answer);
    case "ordering":
      return choiceText(question.items, question.answer);
    case "text":
      return question.answerText;
    case "truefalse":
      return question.answer ? "True" : "False";
  }
}

export function scoreQuestion(
  question: Question,
  response: Response,
  confidence: Confidence | null,
  markedCorrect = false,
): ScoredItem {
  const checked = scoreResponse(question, response);
  /** Only a short text answer can be overruled, and only when the keyword check rejected it. */
  const markedByYou = markedCorrect && question.type === "text" && checked < 1;
  const score = markedByYou ? 1 : checked;
  const correct = score === 1;
  return {
    kind: "question",
    id: question.id,
    title: question.question,
    sources: [question.section],
    score,
    correct,
    errorType: errorType(correct, confidence),
    hasConfidence: confidence !== null,
    effects: {},
    yourAnswer: describeResponse(question, response),
    correctAnswer: describeAnswer(question),
    why: [question.why],
    ...(markedByYou && { markedByYou }),
  };
}
