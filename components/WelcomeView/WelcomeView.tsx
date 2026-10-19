import { ButtonLink } from "@/components/Button/Button";

export const APP_NAME = "AI Scenario Trainer";
/** The existing one-line purpose (the app's description). */
export const APP_PURPOSE =
  "Practise decisions in a scenario built from a study guide, then review your errors with links to the source.";

/** Welcome: the app name, one line of purpose, Create account and "I already have an account". */
export function WelcomeView() {
  return (
    <div className="flex flex-1 flex-col gap-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-3 pt-6">
        <h1 className="type-page-title">{APP_NAME}</h1>
        <p className="type-body text-text-secondary">{APP_PURPOSE}</p>
      </div>
      <div className="mt-auto flex flex-col items-center gap-2 pt-2">
        <ButtonLink href="/sign-up">Create account</ButtonLink>
        <ButtonLink variant="tertiary" href="/sign-in">
          I already have an account
        </ButtonLink>
      </div>
    </div>
  );
}
