import { ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/Button/Button";
import { SoftShape } from "@/components/SoftShape/SoftShape";
import type { NextUp } from "@/lib/home";

/** The sage "Next up" card on Home: what to do now, with one primary button. */
export function NextUpCard({
  next,
  onRepeat,
  onStartScenario,
}: {
  next: NextUp;
  onRepeat: () => void;
  onStartScenario: () => void;
}) {
  const top = (
    <>
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-next-tile text-text"
      >
        <Target size={24} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-label text-text-secondary">Next up</span>
        <span id="next-up-title" className="type-item-title text-text">
          {next.title}
        </span>
        <span className="type-small text-text-secondary">{next.detail}</span>
      </span>
    </>
  );

  return (
    <section
      aria-labelledby="next-up-title"
      className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[28px] bg-next-card p-4 shadow-(--card-shadow)"
    >
      <SoftShape variant="strong" />
      {next.linksToTopics ? (
        <Link href="/weak-topics" className="-m-1 flex items-center gap-3 rounded-panel p-1">
          {top}
          <span className="sr-only">, see all weak topics</span>
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text"
          >
            <ArrowRight size={20} strokeWidth={2} />
          </span>
        </Link>
      ) : (
        <div className="flex items-center gap-3">{top}</div>
      )}
      {next.kind === "continue" ? (
        <ButtonLink href="/session">{next.action}</ButtonLink>
      ) : (
        <Button onClick={next.kind === "repeat" ? onRepeat : onStartScenario}>{next.action}</Button>
      )}
    </section>
  );
}
