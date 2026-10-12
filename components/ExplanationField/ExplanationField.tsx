import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

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
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  // Keep the field clear of the fixed action bar, also when the on-screen keyboard opens.
  // The field's bottom scroll margin leaves room for the bar.
  useEffect(() => {
    const viewport = window.visualViewport;
    const reveal = () => {
      if (document.activeElement === fieldRef.current) {
        fieldRef.current?.scrollIntoView({ block: "nearest" });
      }
    };
    viewport?.addEventListener("resize", reveal);
    return () => viewport?.removeEventListener("resize", reveal);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <textarea
        ref={fieldRef}
        id={id}
        onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest" })}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        placeholder="In one sentence"
        className={`w-full scroll-mb-48 resize-none rounded-panel border bg-surface px-4 py-3 text-base hover:border-text focus-visible:border-primary ${
          error ? "border-wrong" : "border-border-strong"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-2 text-sm text-wrong">
          <X size={16} strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
