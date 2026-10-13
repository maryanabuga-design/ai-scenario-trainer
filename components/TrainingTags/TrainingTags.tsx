import { Tag } from "@/components/Tag/Tag";
import type { Training } from "@/lib/training";

/** Small "Scenario" and "Quiz" tags for a material whose training has been created. */
export function TrainingTags({ training }: { training: Training | undefined }) {
  if (!training) return null;
  return (
    <span className="flex flex-wrap gap-2">
      {training.scenario && <Tag>Scenario</Tag>}
      {training.quiz && <Tag>Quiz</Tag>}
    </span>
  );
}
