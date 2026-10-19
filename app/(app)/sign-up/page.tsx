"use client";

import { useRouter } from "next/navigation";
import { SignUpView } from "@/components/SignUpView/SignUpView";
import { startSignUp, useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const router = useRouter();
  const auth = useAuth();
  if (auth === "loading") return null;
  // the typed values come back when the person returns with "Change email"
  const pending = auth.pending?.mode === "sign-up" ? auth.pending : null;
  return (
    <SignUpView
      initial={
        pending
          ? { name: pending.name, email: pending.email, role: pending.role }
          : { name: "", email: "", role: "student" }
      }
      onSubmit={(values) => {
        const result = startSignUp(values);
        if (result === "ok") router.push("/verify");
        return result === "exists" ? "exists" : "ok";
      }}
    />
  );
}
