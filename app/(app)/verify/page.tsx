"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VerifyView } from "@/components/VerifyView/VerifyView";
import { useAuth, verifyCode } from "@/lib/auth";

export default function VerifyPage() {
  const router = useRouter();
  const auth = useAuth();
  const pending = auth === "loading" ? null : auth.pending;
  const signedIn = auth !== "loading" && auth.session !== null;

  // without a pending verification there is nothing to check
  useEffect(() => {
    if (auth !== "loading" && !pending && !signedIn) router.replace("/welcome");
  }, [auth, pending, signedIn, router]);

  if (auth === "loading" || !pending) return null;
  return (
    <VerifyView
      email={pending.email}
      now={Date.now}
      onChangeEmail={() => router.push(pending.mode === "sign-up" ? "/sign-up" : "/sign-in")}
      onVerify={(code) => {
        const result = verifyCode(code);
        if (result.ok) router.push(result.destination);
        return result.ok;
      }}
    />
  );
}
