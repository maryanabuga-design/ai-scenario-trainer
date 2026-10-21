"use client";

import { useRouter } from "next/navigation";
import { FieldOfWorkStep } from "@/components/FieldOfWork/FieldOfWorkStep";
import { finishFieldStep } from "@/lib/auth";

/** The registration step after Verify: Continue stores the field, Skip stores none; both open the introduction. */
export default function FieldOfWorkPage() {
  const router = useRouter();
  return (
    <FieldOfWorkStep
      onContinue={(field) => {
        finishFieldStep(field);
        router.replace("/onboarding");
      }}
      onSkip={() => {
        finishFieldStep(null);
        router.replace("/onboarding");
      }}
    />
  );
}
