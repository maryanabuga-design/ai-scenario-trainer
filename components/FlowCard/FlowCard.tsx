import type { ReactNode } from "react";
import { CardFooter } from "@/components/ActionBar/ActionBar";

const widths = { narrow: "idesk:max-w-[560px]", wide: "idesk:max-w-[640px]" } as const;

/**
 * The centred card of a form screen (DESIGN.md: Responsive instructor, step 6): below 1024px it is
 * invisible (`contents`) and the screen is exactly the phone screen; from 1024px in the instructor
 * shell the content becomes ONE white card, centred under the page header, at most 560 or 640px
 * wide, closed by the actions in `footer` (Secondary on the left, Primary on the right) after a
 * 1px divider. The screen's pinned bar is then not drawn (`ActionBar hideOnDesk`).
 */
export function FlowCard({
  children,
  footer,
  width = "wide",
  plain = false,
}: {
  children: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof widths;
  /** No card at all (the screen is a card only in some states). */
  plain?: boolean;
}) {
  if (plain) return <>{children}</>;
  return (
    <div
      data-flow-card
      className={`contents idesk:mx-auto idesk:mt-4 idesk:flex idesk:w-full idesk:flex-col idesk:gap-6 idesk:rounded-card idesk:border idesk:border-selectable-stroke idesk:bg-card idesk:p-8 idesk:shadow-(--card-shadow) ${widths[width]}`}
    >
      {children}
      {footer && <CardFooter>{footer}</CardFooter>}
    </div>
  );
}
