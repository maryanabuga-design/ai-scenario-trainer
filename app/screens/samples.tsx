"use client";

import { useState } from "react";
import { SessionSetup } from "@/components/SessionSetup/SessionSetup";
import type { Length } from "@/components/SessionSetup/SessionSetup";

/** Interactive sample screens for the /screens review page. They never touch the saved session. */
export function SetupSample() {
  const [length, setLength] = useState<Length>("full");
  return <SessionSetup length={length} onLengthChange={setLength} onStart={() => undefined} />;
}
