"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OnboardingView } from "@/components/OnboardingView/OnboardingView";
import { finishOnboarding, useCurrentAccount } from "@/lib/auth";
import type { Account } from "@/lib/auth";
import { nextIndex, previousIndex, replayReturnHref, slidesFor } from "@/lib/onboarding";
import { roleHome } from "@/lib/role";

function Loaded({ account }: { account: Account }) {
  const router = useRouter();
  const count = slidesFor(account.role).length;
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "previous">("next");
  // seen already: Profile, Help, "How the app works" shows it again and returns to Profile
  const [replay] = useState(account.onboardingDone);

  // Skip and Get started set it done and open the Home of the role (Profile on a replay)
  function finish() {
    if (!replay) finishOnboarding();
    router.replace(replay ? replayReturnHref : roleHome(account.role));
  }

  return (
    <OnboardingView
      role={account.role}
      index={index}
      direction={direction}
      onNext={() => {
        setDirection("next");
        setIndex((now) => nextIndex(now, count));
      }}
      onPrevious={() => {
        setDirection("previous");
        setIndex((now) => previousIndex(now));
      }}
      onSkip={finish}
      onFinish={finish}
    />
  );
}

export default function Onboarding() {
  const account = useCurrentAccount();
  if (account === "loading" || !account) return null;
  return <Loaded account={account} />;
}
