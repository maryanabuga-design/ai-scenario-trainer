"use client";

import { ButtonLink } from "@/components/Button/Button";
import { IntroStage } from "@/components/IntroStage/IntroStage";
import { groupByCode, saveJoin } from "@/lib/join";
import { heroSlotFiles } from "@/lib/media-frames";

export const INVALID_JOIN = "This invitation link is not valid.";

/**
 * The join screen (DESIGN.md: Instructor, Students rebuilt, join link): "You are invited to Rescue
 * team" with the Primary "Create account" (it keeps the code for the sign-up) and the Secondary
 * "Sign in"; an unknown code says the link is not valid and offers "Back to welcome".
 */
export function JoinView({ code }: { code: string }) {
  const group = groupByCode(code);
  return (
    <IntroStage
      slot={heroSlotFiles.welcome}
      priority
      bottom={
        group ? (
          <>
            <ButtonLink href="/sign-up" onClick={() => saveJoin(group.code)}>
              Create account
            </ButtonLink>
            <ButtonLink variant="secondary" href="/sign-in">
              Sign in
            </ButtonLink>
          </>
        ) : (
          <ButtonLink variant="secondary" href="/welcome">
            Back to welcome
          </ButtonLink>
        )
      }
    >
      <div className="flex min-h-[120px] flex-col items-center justify-start gap-2 px-2 text-center">
        {group ? (
          <>
            <p data-eyebrow className="type-small-strong text-text-secondary">
              Invitation
            </p>
            <h1 data-join-title className="type-page-title line-clamp-2">
              You are invited to {group.name}
            </h1>
            <p className="type-body max-w-[320px] text-text-secondary">
              Create an account to join your group and train with your instructor.
            </p>
          </>
        ) : (
          <h1 data-join-title className="type-page-title line-clamp-2">
            {INVALID_JOIN}
          </h1>
        )}
      </div>
    </IntroStage>
  );
}
