"use client";

import { useRouter } from "next/navigation";
import { GroupCodeView } from "@/components/GroupCodeView/GroupCodeView";
import { useCurrentAccount } from "@/lib/auth";
import { lookupCode } from "@/lib/join";

export default function GroupCodePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  if (account === "loading") return null;
  return (
    <GroupCodeView
      backHref={account ? "/" : "/welcome"}
      onContinue={(code) => {
        if (lookupCode(code).kind === "unknown") return "unknown";
        router.push(`/join/${encodeURIComponent(code)}`);
        return "ok";
      }}
    />
  );
}
