import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/**
 * The common header of Create account, Sign in and Verify: the white circular Back (40px) on the left
 * and the muted caption "Step 1 of 2" on the right. `onBack` makes the Back a button (Verify goes
 * back to the form with the typed values); otherwise it is a link to `href`.
 */
export function FormHeader({
  step,
  href = "/welcome",
  label = "Back to Welcome",
  onBack,
}: {
  step: 1 | 2;
  href?: string;
  label?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onBack ? (
        <CircleBackButton size="small" label={label} onClick={onBack} />
      ) : (
        <CircleBackButton size="small" label={label} href={href} />
      )}
      <p data-form-step className="type-small text-text-secondary">
        Step {step} of 2
      </p>
    </div>
  );
}
