"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfileView } from "@/components/ProfileView/ProfileView";
import { deleteAccount, setRole, signOut, useCurrentAccount } from "@/lib/auth";
import { defaultDirection } from "@/lib/directions";
import { roleHome } from "@/lib/role";
import { resetProgress, saveProfile, useProfile } from "@/lib/session";

export default function Profile() {
  const router = useRouter();
  const profile = useProfile();
  const account = useCurrentAccount();
  const [dialog, setDialog] = useState<"reset" | "delete" | null>(null);
  const [resetDone, setResetDone] = useState(false);

  if (profile === "loading" || account === "loading" || !account) return null;

  return (
    <ProfileView
      account={account}
      onRoleChange={(next) => {
        setRole(next);
        router.push(roleHome(next));
      }}
      direction={profile?.direction ?? defaultDirection.id}
      onDirectionChange={(direction) => saveProfile({ direction })}
      dialog={dialog}
      onAskReset={() => {
        setResetDone(false);
        setDialog("reset");
      }}
      onAskDelete={() => setDialog("delete")}
      onCancelDialog={() => setDialog(null)}
      onReset={() => {
        resetProgress();
        setDialog(null);
        setResetDone(true);
      }}
      onDelete={() => {
        deleteAccount();
        setDialog(null);
        router.replace("/welcome");
      }}
      onSignOut={() => {
        signOut();
        router.replace("/welcome");
      }}
      resetDone={resetDone}
      onBack={
        account.role === "student"
          ? () => (window.history.length > 1 ? router.back() : router.push("/"))
          : undefined
      }
    />
  );
}
