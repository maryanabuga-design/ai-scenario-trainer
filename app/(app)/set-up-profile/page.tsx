"use client";

import { useRouter } from "next/navigation";
import { ProfileSetupView } from "@/components/ProfileSetupView/ProfileSetupView";
import { completeProfile, groupOf, useCurrentAccount } from "@/lib/auth";
import { setFlash } from "@/lib/flash";
import { groupById } from "@/lib/groups";

export default function SetUpProfilePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  if (account === "loading" || account === null) return null;
  const groupId = groupOf(account);
  const group = groupId ? groupById(groupId) : undefined;
  return (
    <ProfileSetupView
      initialName=""
      onSubmit={(input) => {
        completeProfile(input);
        if (group) setFlash(`You joined ${group.name}`, "/");
        router.push("/");
      }}
    />
  );
}
