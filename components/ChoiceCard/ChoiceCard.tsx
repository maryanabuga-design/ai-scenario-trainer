import type { ReactNode } from "react";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
};

/** A large radio option: white card, radio circle on the right, black border when selected. */
export function ChoiceCard({ name, value, checked, onChange, disabled = false, children }: Props) {
  return (
    <label
      className={`flex min-h-14 items-center gap-4 rounded-panel border px-4 py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${
        checked ? "border-2 border-primary px-[15px] py-[11px]" : "border-border"
      } ${
        disabled
          ? "cursor-not-allowed border-transparent bg-surface-muted text-text-secondary"
          : "cursor-pointer bg-surface hover:border-text-secondary"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className="flex-1">{children}</span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-primary" : "border-text-secondary"
        } ${disabled ? "border-dashed" : ""}`}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
    </label>
  );
}
