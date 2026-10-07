"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { sessionLengths } from "@/lib/scenario";
import { startSession } from "@/lib/session";

export default function SetupPage() {
  const router = useRouter();
  const [length, setLength] = useState<Length>("full");

  return (
    <SessionSetup
      length={length}
      onLengthChange={setLength}
      onStart={() => {
        startSession(length, [...sessionLengths[length].stepIds]);
        router.push("/session");
      }}
    />
  );
}
