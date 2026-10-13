import { Check } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** "checkbox" draws a square box and lets the caller toggle the value. */
  type?: "radio" | "checkbox";
  /** Smaller padding for long lists such as quiz sections. */
  compact?: boolean;
  children: ReactNode;
};

/** A large option: white card, radio circle or check box on the right, black border when selected. */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  type = "radio",
  compact = false,
  children,
}: Props) {
  const padding = compact
    ? checked
      ? "min-h-12 px-[15px] py-[7px]"
      : "min-h-12 px-4 py-2"
    : checked
      ? "min-h-14 px-[15px] py-[11px]"
      : "min-h-14 px-4 py-3";
  return (
    <label
      className={`flex items-center gap-4 rounded-panel border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${padding} ${
        checked ? "border-2 border-primary" : "border-border"
      } ${
        disabled
          ? "cursor-not-allowed border-transparent bg-neutral-surface text-text-secondary"
          : "cursor-pointer bg-surface active:bg-neutral-surface"
      }`}
    >
      <input
        type={type}
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
        className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
          type === "checkbox" ? "rounded-[4px]" : "rounded-full"
        } ${checked ? "border-primary" : "border-text-secondary"} ${
          checked && type === "checkbox" ? "bg-primary" : ""
        } ${disabled ? "border-dashed" : ""}`}
      >
        {checked &&
          (type === "checkbox" ? (
            <Check size={14} strokeWidth={2.5} aria-hidden="true" className="text-primary-text" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          ))}
      </span>
    </label>
  );
}
