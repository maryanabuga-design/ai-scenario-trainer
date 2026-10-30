"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

/**
 * A search field (DESIGN.md: Instructor, Students rebuilt): the TextField's 52px input with a
 * magnifier at the left and a clear button (44px tap target) at the right while it is filled.
 */
export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** 48px high, level with a 48px icon button beside it (default 52px). */
  compact?: boolean;
}) {
  const id = useId();
  return (
    <div className="relative flex flex-col">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={20}
        strokeWidth={2}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary"
      />
      <input
        id={id}
        type="search"
        name="student-search"
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`type-body ${compact ? "h-12" : "h-[52px]"} w-full rounded-[14px] border border-selectable-stroke bg-card pr-12 pl-12 text-text placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary [&::-webkit-search-cancel-button]:hidden`}
      />
      {value !== "" && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-text-secondary"
        >
          <X size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
