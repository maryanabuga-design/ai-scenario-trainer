"use client";

import { useRouter } from "next/navigation";
import { InvitationView } from "@/components/InvitationView/InvitationView";
import { groupOf, joinGroup, startSignUp, useCurrentAccount } from "@/lib/auth";
import { setFlash } from "@/lib/flash";
import { lookupCode, saveJoin } from "@/lib/join";

/** The invitation for the code of the address, in the state of the person who opened it. */
export function InvitationScreen({ code }: { code: string }) {
  const router = useRouter();
  const account = useCurrentAccount();
  if (account === "loading") return null;
  const found = lookupCode(code);
  const startHref = account ? "/" : "/welcome";
  if (found.kind !== "valid") return <InvitationView state="invalid" startHref={startHref} />;
  const { group, invitedBy } = found;

  if (!account) {
    return (
      <InvitationView
        state="new"
        groupName={group.name}
        invitedBy={invitedBy}
        startHref={startHref}
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
      onJoin={() => {
        joinGroup(group.id);
        setFlash(`You joined ${group.name}`, "/");
        router.push("/");
      }}
    />
  );
}
