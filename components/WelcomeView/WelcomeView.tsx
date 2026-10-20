import { ButtonLink } from "@/components/Button/Button";
import { HeroPanel } from "@/components/HeroPanel/HeroPanel";

export const APP_NAME = "AI Scenario Trainer";
export const WELCOME_TITLE = "Train for real situations";
export const WELCOME_SUBTITLE =
  "Short scenarios, quizzes and exams for building evacuation and first aid.";
export const WELCOME_NOTE = "For educational use. Demo data stays on this device.";

/**
 * Welcome (DESIGN.md: Accounts): the hero panel with its 3D slot, the centred text (eyebrow, title,
 * subtitle) and the pinned buttons. No header and no navigation.
 */
export function WelcomeView() {
  return (
    <div className="flex flex-1 flex-col">
      <HeroPanel />
      <div className="flex flex-col items-center gap-2 px-2 pt-8 text-center">
        <p data-eyebrow className="type-small-strong text-text-secondary">
          {APP_NAME}
        </p>
        <h1 className="type-page-title">{WELCOME_TITLE}</h1>
        <p className="type-body max-w-[320px] text-text-secondary">{WELCOME_SUBTITLE}</p>
      </div>
      <div className="mt-auto flex flex-col gap-3 pt-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]">
        <ButtonLink href="/sign-up">Create account</ButtonLink>
        <ButtonLink variant="secondary" href="/sign-in">
          I already have an account
        </ButtonLink>
        <p className="type-caption text-center text-text-secondary">{WELCOME_NOTE}</p>
      </div>
    </div>
  );
}
