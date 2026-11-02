"use client";

import { useRouter } from "next/navigation";
import { ProfileSetupView } from "@/components/ProfileSetupView/ProfileSetupView";
import { backToCodeStep, completeProfile, groupOf, useCurrentAccount } from "@/lib/auth";
import { setFlash } from "@/lib/flash";
import { groupById } from "@/lib/groups";
import { saveJoin } from "@/lib/join";

export default function SetUpProfilePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  if (account === "loading" || account === null) return null;
  const groupId = groupOf(account);
  const group = groupId ? groupById(groupId) : undefined;
  return (
    <ProfileSetupView
      initialName=""
      onBack={() => {
        // the code step again, for the same email (the account of this step is taken back)
        const groupId = backToCodeStep();
        const back = groupId ? groupById(groupId) : undefined;
        // the invitation the person came from is remembered again, for the next verification
        if (back) saveJoin(back.code);
        router.push("/verify");
      }}
      onSubmit={(input) => {
        completeProfile(input);
        if (group) setFlash(`You joined ${group.name}`, "/");
        router.push("/");
      }}
    />
  );
}
