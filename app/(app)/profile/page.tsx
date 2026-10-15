"use client";

import { useState } from "react";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { defaultDirection } from "@/lib/directions";
import { useSaved } from "@/lib/saved";
import { resetProgress, saveProfile, useProfile } from "@/lib/session";

export default function Profile() {
  const profile = useProfile();
  const saved = useSaved();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (profile === "loading") return null;

  return (
    <ProfileView
      savedCount={Array.isArray(saved) ? saved.length : 0}
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
