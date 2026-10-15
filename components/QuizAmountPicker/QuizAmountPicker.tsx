import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import type { QuizAmount } from "@/lib/quiz-setup";
import { amountOptions } from "@/lib/quiz-setup";

const lengthNames = { 5: "Default", 10: "Extended" } as const;

/**
 * "How many questions?": SelectableCards for 5 (the default) and 10 (Extended). An amount larger
 * than the available total is disabled, with a hint; when the sections hold fewer than 5 questions
 * the quiz uses all of them. Create training and Session setup share it.
 */
export function QuizAmountPicker({
  name,
  amount,
  available,
  hasSections,
  onChange,
}: {
  name: string;
  amount: QuizAmount;
  available: number;
  hasSections: boolean;
  onChange: (amount: QuizAmount) => void;
}) {
  const options = amountOptions(available);
  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-3">
        <legend className="type-body-strong mb-3">How many questions?</legend>
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <SelectableCard
              key={option.count}
              name={name}
              value={String(option.count)}
              checked={amount.countChoice === option.count}
              disabled={option.disabled}
              onChange={() => onChange({ ...amount, countChoice: option.count })}
            >
              <span className="flex flex-col">
                <span className="type-body-strong tabular-nums">{option.count}</span>
                <span className="type-small text-text-secondary">{lengthNames[option.count]}</span>
              </span>
            </SelectableCard>
          ))}
        </div>
      </fieldset>
      {hasSections && options.some((option) => option.disabled) && (
        <p className="type-small text-text-secondary">Not enough questions for these sections</p>
      )}
    </div>
  );
}
