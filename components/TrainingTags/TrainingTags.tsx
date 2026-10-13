import { Tag } from "@/components/Tag/Tag";
import type { Training } from "@/lib/training";

/** Small "Scenario" and "Quiz" tags for a material whose training has been created. */
export function TrainingTags({ training }: { training: Training | undefined }) {
  if (!training) return null;
  return (
    <span className="flex flex-wrap gap-2">
      {training.scenario && <Tag tone="yellow">Scenario</Tag>}
      {training.quiz && <Tag tone="blue">Quiz</Tag>}
    </span>
  );
}
