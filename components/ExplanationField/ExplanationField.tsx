import { useId } from "react";

/** One-sentence explanation. The label is the step's follow-up question. */
export function ExplanationField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="In one sentence"
        className={`w-full resize-none rounded-panel border bg-surface px-4 py-3 text-base hover:border-text-secondary focus-visible:border-primary ${
          error ? "border-wrong" : "border-border"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-2 text-sm text-wrong">
          <span aria-hidden="true">✕</span>
          {error}
        </p>
      )}
    </div>
  );
}
