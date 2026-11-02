"use client";

import { useRouter } from "next/navigation";
import { GroupCodeView } from "@/components/GroupCodeView/GroupCodeView";
import { useCurrentAccount } from "@/lib/auth";
import { lookupCode, rememberTypedCode, typedGroupCode } from "@/lib/join";

export default function GroupCodePage() {
  const router = useRouter();
  const account = useCurrentAccount();
  if (account === "loading") return null;
  return (
    <GroupCodeView
      backHref={account ? "/" : "/welcome"}
      initialCode={typedGroupCode()}
      onContinue={(code) => {
        rememberTypedCode(code);
        if (lookupCode(code).kind === "unknown") return "unknown";
        router.push(`/join/${encodeURIComponent(code)}`);
        return "ok";
      }}
    />
  );
}
