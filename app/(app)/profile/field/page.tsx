"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FieldPickerView } from "@/components/FieldOfWork/FieldPickerView";
import { setField, useCurrentAccount } from "@/lib/auth";

function Picker() {
  const account = useCurrentAccount();
  const fromAskAi = useSearchParams().get("from") === "ask-ai";
  if (account === "loading" || !account) return null;
  return (
    <FieldPickerView
      value={account.field}
      onChange={setField}
      onClear={() => setField(null)}
      back={
        fromAskAi
          ? { label: "Back to Ask AI", href: "/ask-ai" }
          : { label: "Back to Profile", href: "/profile" }
      }
    />
  );
}

export default function FieldPage() {
  return (
    <Suspense fallback={null}>
      <Picker />
    </Suspense>
  );
}
