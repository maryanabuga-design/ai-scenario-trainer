import { ButtonLink } from "@/components/Button/Button";

/** "Back" text action at the top left of screens without navigation. */
export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <div className="-ml-3">
      <ButtonLink href={href} variant="text">
        {label}
      </ButtonLink>
    </div>
  );
}
