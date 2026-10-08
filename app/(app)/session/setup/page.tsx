"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";
import { sessionLengths } from "@/lib/scenario";
import { startSession, useSession } from "@/lib/session";

export default function SetupPage() {
  const router = useRouter();
  const [length, setLength] = useState<Length>("full");
  const session = useSession();

  return (
    <SessionSetup
      length={length}
      onLengthChange={setLength}
      replacesUnfinished={session !== "loading" && session !== null && !session.finished}
      onStart={() => {
        startSession(length, [...sessionLengths[length].stepIds]);
        router.push("/session");
      }}
    />
  );
}
