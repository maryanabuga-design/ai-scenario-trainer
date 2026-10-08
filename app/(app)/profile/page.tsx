"use client";

import { useState } from "react";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { defaultDirection } from "@/lib/directions";
import { resetProgress, saveProfile, useProfile } from "@/lib/session";

export default function Profile() {
  const profile = useProfile();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (profile === "loading") return null;

  return (
    <ProfileView
      direction={profile?.direction ?? defaultDirection.id}
      onDirectionChange={(direction) =>
        saveProfile({ direction, onboarded: profile?.onboarded ?? false })
      }
      confirming={confirming}
      onAskReset={() => {
        setResetDone(false);
        setConfirming(true);
      }}
      onCancelReset={() => setConfirming(false)}
      onReset={() => {
        resetProgress();
        setConfirming(false);
        setResetDone(true);
      }}
      resetDone={resetDone}
    />
  );
}
