"use client";

import {
  Bookmark,
  BookOpen,
  CircleHelp,
  ClipboardCheck,
  ListChecks,
  Route,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  ARROW_CLEARANCE,
  ArrowCircle,
} from "@/components/ArrowCircle/ArrowCircle";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { Ring } from "@/components/Ring/Ring";
import { TileIcon } from "@/components/TileIcon/TileIcon";
import { homeTiles } from "@/lib/home";
import type { HomeCounts, HomeSummary, HomeTileId } from "@/lib/home";
import { onboardingHref } from "@/lib/onboarding";
import type { Part } from "@/lib/parts";

const miniQuizPath = "/mini-quiz?from=home";

const tileIcons: Record<HomeTileId, LucideIcon> = {
  scenarios: Route,
  quiz: CircleHelp,
  weak: ListChecks,
  saved: Bookmark,
  guide: BookOpen,
  checklists: ClipboardCheck,
};

const cardClass =
  "flex min-h-36 w-full flex-col justify-between gap-4 rounded-[28px] bg-card p-5 text-left shadow-(--card-shadow) has-focus-visible:outline-2";

/**
 * Home, the learner view: a greeting with one sentence and the profile button, the big card with
 * one main action, the daily goal and the readiness ring, six tiles and the Mini-quiz.
 * Nothing from Progress is repeated here.
 */
export function HomeView({
  name,
  summary,
  readiness,
  counts,
  onStartPart,
}: {
  name: string;
  summary: HomeSummary;
  /** The readiness percentage: 0 when nothing is done. */
  readiness: number;
  counts: HomeCounts;
  /** Starts the part the "Next" card names, then opens the session. */
  onStartPart: (part: Part) => void;
}) {
  const { card, goal } = summary;
  const tiles = homeTiles(counts);
  const body = (
    <>
      <ArrowCircle />
      <span className={`flex flex-col gap-1 ${ARROW_CLEARANCE.md}`}>
        <span className="type-card-title">{card.title}</span>
        <span className="type-small text-text-secondary">{card.subtitle}</span>
      </span>
      <span className="flex items-end justify-between gap-4">
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="type-small">
            Today: {goal.done}/{goal.goal} questions
          </span>
          <span
            role="progressbar"
            aria-label="Daily goal"
            aria-valuemin={0}
            aria-valuemax={goal.goal}
            aria-valuenow={goal.done}
            className="h-1.5 w-full max-w-40 overflow-hidden rounded-full bg-secondary-sand-pressed"
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(goal.done / goal.goal) * 100}%` }}
            />
          </span>
        </span>
        <Ring percent={readiness} size={56} label={`Readiness ${readiness}%`} />
      </span>
    </>
  );

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-start justify-between gap-3 pt-1">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="type-page-title">Hi, {name}</h1>
          <p className="type-body text-text-secondary">{summary.subtitle}</p>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-surface-muted"
        >
          <User size={20} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      {card.part ? (
        <button
          type="button"
          onClick={() => onStartPart(card.part!)}
          className={`relative ${cardClass}`}
        >
          {body}
        </button>
      ) : (
        <Link href={card.href} className={`relative ${cardClass}`}>
          {body}
        </Link>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href}
              className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
            >
              <Media3D
                variant="icon"
                fallback={
                  <TileIcon icon={tileIcons[tile.id]} tone={tile.tone} />
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="type-body-strong">{tile.title}</span>
                <span className="type-small text-text-secondary">
                  {tile.count}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={miniQuizPath}
        className="flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-strong">Mini-quiz</span>
          <span className="type-small text-text-secondary">
            Choose topics and how many questions
          </span>
        </span>
        <Chevron />
      </Link>

      <div className="-ml-3 self-start">
        <ButtonLink href={onboardingHref} variant="tertiary">
          How it works
        </ButtonLink>
      </div>
    </div>
  );
}
