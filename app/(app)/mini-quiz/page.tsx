"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MiniQuizView } from "@/components/MiniQuizView/MiniQuizView";
import { useSourceSheet } from "@/components/SourceSheet/SourceSheet";
import { drawMiniQuiz, fitAmount, miniQuizPool, miniQuizSections } from "@/lib/mini-quiz";
import { startSession } from "@/lib/session";

/** Where the mini-quiz was opened from, and so where Back (also from Results) goes. */
function origin(from: string | null) {
  return from === "home"
    ? { href: "/", label: "Back to Home" }
    : { href: "/training?mode=quiz", label: "Back to Training" };
}

function MiniQuiz() {
  const router = useRouter();
  const { sections } = useSourceSheet();
  const from = origin(useSearchParams().get("from"));
  const [selected, setSelected] = useState<string[]>(miniQuizSections);
  const [chosen, setChosen] = useState<number | null>(null);

  const pool = miniQuizPool(selected).length;
  const amount = fitAmount(chosen, pool);
  const topics = miniQuizSections.map((id) => ({
    id,
    title: sections.find((section) => section.id === id)?.title ?? id,
    detail: `${miniQuizPool([id]).length} questions`,
  }));

  return (
    <MiniQuizView
      backHref={from.href}
      backLabel={from.label}
      topics={topics}
      selected={selected}
      onSelectedChange={setSelected}
      pool={pool}
      amount={amount}
      onAmountChange={setChosen}
      onStart={() => {
        if (amount === null) return;
        // A new random draw and order on every start; no part, so no part ring changes.
        startSession("quiz", drawMiniQuiz(selected, amount), {
          returnTo: from.href,
          mode: "mini-quiz",
        });
        router.push("/session");
      }}
    />
  );
}

export default function MiniQuizPage() {
  return (
    <Suspense fallback={null}>
      <MiniQuiz />
    </Suspense>
  );
}
