import type { ReactNode } from "react";

type Props = {
  label: string;
  /** Build step from docs/build-plan.md. Omit when the screen is built. */
  plannedStep?: number;
  children?: ReactNode;
};

/** A 390 by 844 phone screen for the development-only /screens review page. */
export function PhoneFrame({ label, plannedStep, children }: Props) {
  const built = plannedStep === undefined;
  return (
    <figure className="flex w-[390px] shrink-0 flex-col gap-2">
      <figcaption className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-text-secondary">{built ? "Built" : `Not built yet · step ${plannedStep}`}</span>
      </figcaption>
      <div
        className={`flex h-[844px] flex-col overflow-hidden rounded-card bg-bg ${
          built ? "border border-border" : "items-center justify-center border border-dashed border-text-secondary"
        }`}
      >
        {built ? (
          children
        ) : (
          <p className="px-6 text-center text-sm text-text-secondary">{label}</p>
        )}
      </div>
    </figure>
  );
}
