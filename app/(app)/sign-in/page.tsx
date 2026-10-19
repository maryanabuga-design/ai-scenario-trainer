"use client";

import { useRouter } from "next/navigation";
import { SignInView } from "@/components/SignInView/SignInView";
import { startSignIn, useAuth } from "@/lib/auth";

export default function SignInPage() {
  const router = useRouter();
  const auth = useAuth();
  if (auth === "loading") return null;
  const pending = auth.pending?.mode === "sign-in" ? auth.pending : null;
  return (
    <SignInView
      initialEmail={pending?.email ?? ""}
      onSubmit={(email) => {
        const result = startSignIn(email);
        if (result === "ok") router.push("/verify");
        return result === "unknown" ? "unknown" : "ok";
      }}
    />
  );
}
