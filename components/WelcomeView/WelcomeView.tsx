import { ButtonLink } from "@/components/Button/Button";
import { IntroStage } from "@/components/IntroStage/IntroStage";
import { heroSlotFiles } from "@/lib/media-frames";

export const APP_NAME = "AI Scenario Trainer";
export const WELCOME_TITLE = "Train for real situations";
export const WELCOME_SUBTITLE =
  "Short scenarios, quizzes and exams for building evacuation and first aid.";
export const WELCOME_NOTE = "For educational use. Demo data stays on this device.";

/**
 * Welcome (DESIGN.md: Accounts): on the plain page, the 3D picture and the centred text (eyebrow,
 * title, subtitle) centred in the free space, and the pinned buttons. No header and no navigation.
 */
export function WelcomeView() {
  return (
    <IntroStage
      slot={heroSlotFiles.welcome}
      priority
      bottom={
        <>
          <ButtonLink href="/sign-up">Create account</ButtonLink>
          <ButtonLink variant="secondary" href="/sign-in">
            I already have an account
          </ButtonLink>
          <p className="type-caption text-center text-text-secondary">{WELCOME_NOTE}</p>
        </>
      }
    >
      {/* a fixed minimum height (a two-line title, a three-line subtitle) */}
      <div className="flex min-h-[184px] flex-col items-center justify-start gap-2 px-2 text-center">
        <p data-eyebrow className="type-small-strong text-text-secondary">
          {APP_NAME}
        </p>
        <h1 className="type-page-title line-clamp-2">{WELCOME_TITLE}</h1>
        <p className="type-body line-clamp-3 max-w-[320px] text-text-secondary">
          {WELCOME_SUBTITLE}
        </p>
      </div>
    </IntroStage>
  );
}
