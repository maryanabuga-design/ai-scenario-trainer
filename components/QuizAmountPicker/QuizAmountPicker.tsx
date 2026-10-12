import { PillGroup } from "@/components/PillGroup/PillGroup";
import { Stepper } from "@/components/Stepper/Stepper";
import type { QuizAmount } from "@/lib/quiz-setup";
import { amountOptions, customCap } from "@/lib/quiz-setup";

/**
 * "How many questions?": option chips 5, 10, 15 and Custom (a stepper capped at the total).
 * Amounts larger than the available total are disabled, with a hint. Create training and
 * Session setup share it.
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
      <PillGroup
        name={name}
        legend="How many questions?"
        options={[
          ...options.map((option) => ({
            value: option.count as QuizAmount["countChoice"],
            label: String(option.count),
            disabled: option.disabled,
          })),
          { value: "custom" as const, label: "Custom" },
        ]}
        value={amount.countChoice}
        onChange={(countChoice) => onChange({ ...amount, countChoice })}
      />
      {amount.countChoice === "custom" && (
        <Stepper
          label="Number of questions"
          value={Math.min(amount.customCount, customCap(available))}
          min={1}
          max={customCap(available)}
          onChange={(customCount) => onChange({ ...amount, customCount })}
        />
      )}
      {hasSections && options.some((option) => option.disabled) && (
        <p className="type-small text-text-secondary">Not enough questions for these sections</p>
      )}
    </div>
  );
}
