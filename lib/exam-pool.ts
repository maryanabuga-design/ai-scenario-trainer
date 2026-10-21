import { drawExam } from "@/lib/exam";

/**
 * The fixed set of questions of a group exam (DESIGN.md: Instructor, Exams rebuilt): a seeded draw
 * from the exam's topics, so every student gets the same questions in the same order and the
 * results can be compared per question ("Q4", the hardest questions). Pure and deterministic.
 */
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const char of seed) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619) >>> 0;
  }
  // mulberry32
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache = new Map<string, string[]>();

export function examQuestionIds(exam: {
  id: string;
  topicIds: string[];
  questionCount: number;
}): string[] {
  const key = `${exam.id}|${exam.topicIds.join()}|${exam.questionCount}`;
  const known = cache.get(key);
  if (known) return known;
  const ids = drawExam(seededRandom(key), exam.questionCount, exam.topicIds);
  cache.set(key, ids);
  return ids;
}
