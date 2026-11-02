"use client";

import { useRouter } from "next/navigation";
import { InvitationView } from "@/components/InvitationView/InvitationView";
import { groupOf, joinGroup, startSignUp, useAuth, useCurrentAccount } from "@/lib/auth";
import { setFlash } from "@/lib/flash";
import { lookupCode, saveJoin } from "@/lib/join";
import { hasPreviousScreen } from "@/lib/navigation-origin";

/** The invitation for the code of the address, in the state of the person who opened it. */
export function InvitationScreen({ code }: { code: string }) {
  const router = useRouter();
  const auth = useAuth();
  const account = useCurrentAccount();
  if (account === "loading" || auth === "loading") return null;
  const found = lookupCode(code);
  const startHref = account ? "/" : "/welcome";
  // Back: the previous screen of the app, or a safe screen when the link was opened directly
  const onBack = () => (hasPreviousScreen() ? router.back() : router.push(startHref));
  if (found.kind !== "valid") {
    return <InvitationView state="invalid" startHref={startHref} onBack={onBack} />;
  }
  const { group, invitedBy } = found;

  if (!account) {
    // coming back from the code screen with "Change email" or Back keeps the typed address
    const typed = auth.pending?.mode === "sign-up" ? auth.pending.email : "";
    return (
      <InvitationView
        state="new"
        groupName={group.name}
        invitedBy={invitedBy}
        startHref={startHref}
        onBack={onBack}
        initialEmail={typed}
        onEmail={(email) => {
          const result = startSignUp({ name: "", email, role: "student" });
          if (result !== "ok") return "exists";
          saveJoin(group.code);
          router.push("/verify");
          return "ok";
        }}
      />
    );
  }

  const member = groupOf(account) === group.id;
  return (
    <InvitationView
      state={member ? "member" : "can-join"}
      groupName={group.name}
      invitedBy={invitedBy}
      startHref={startHref}
      onBack={onBack}
      onJoin={() => {
        joinGroup(group.id);
        setFlash(`You joined ${group.name}`, "/");
        router.push("/");
      }}
    />
  );
}
