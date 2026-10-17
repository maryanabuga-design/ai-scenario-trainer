import { Button, ButtonLink } from "@/components/Button/Button";
import { QUICK_PRACTISE_LABEL, QUICK_STEPS_LABEL } from "@/lib/reading";

/**
 * The quick actions of a long reading screen: Steps (when the topic has steps) and Practise this
 * topic, fixed at the bottom over a 24px fade to the page colour. It has no panel and no border;
 * the buttons carry the soft shadow. Hidden, it is not focusable and not announced.
 */
export function QuickActionsBar({
  visible,
  stepsHref,
  onPractise,
  placement = "fixed",
}: {
  visible: boolean;
  stepsHref: string | null;
  onPractise: () => void;
  /** "absolute" is for the screen review page, where the bar sits inside a phone frame. */
  placement?: "fixed" | "absolute";
}) {
  const shadow = "rounded-button shadow-(--card-shadow)";
  return (
    <div
      data-quick-bar
      data-full-bleed
      aria-hidden={!visible}
      inert={!visible}
      className={`pointer-events-none ${placement} inset-x-0 bottom-0 z-10 mx-auto flex max-w-app flex-col transition-[opacity,translate,visibility] duration-160 motion-reduce:transition-none ${visible ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"}`}
    >
      <div
        aria-hidden="true"
        className="h-6 bg-[linear-gradient(to_bottom,transparent,var(--bg))]"
      />
      <div className="flex gap-3 bg-bg px-[var(--gutter,1rem)] pt-1 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]">
        {stepsHref && (
          <div className={`pointer-events-auto flex-1 ${shadow}`}>
            <ButtonLink href={stepsHref} variant="secondary">
              {QUICK_STEPS_LABEL}
            </ButtonLink>
          </div>
        )}
        <div className={`pointer-events-auto flex-1 ${shadow}`}>
          <Button onClick={onPractise}>{QUICK_PRACTISE_LABEL}</Button>
        </div>
      </div>
    </div>
  );
}
