"use client";

import { useState } from "react";
import { AboutView } from "@/components/AboutView/AboutView";
import { restartDemo } from "@/lib/restart";

export default function AboutPage() {
  const [confirming, setConfirming] = useState(false);
  return (
    <AboutView
      confirming={confirming}
      onAskRestart={() => setConfirming(true)}
      onCancel={() => setConfirming(false)}
      onRestart={restartDemo}
    />
  );
}
