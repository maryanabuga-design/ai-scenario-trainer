"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { defaultDirection } from "@/lib/directions";
import { roleHome, setRole, useRole } from "@/lib/role";
import { resetProgress, saveProfile, useProfile } from "@/lib/session";

export default function Profile() {
  const router = useRouter();
  const profile = useProfile();
  const role = useRole();
  const [confirming, setConfirming] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  if (profile === "loading" || role === "loading") return null;

  return (
    <ProfileView
      role={role}
      onRoleChange={(next) => {
        setRole(next);
        router.push(roleHome(next));
      }}
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
