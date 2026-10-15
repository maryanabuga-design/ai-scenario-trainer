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
import { ARROW_CLEARANCE, ArrowCircle } from "@/components/ArrowCircle/ArrowCircle";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { Ring } from "@/components/Ring/Ring";
import { TileIcon } from "@/components/TileIcon/TileIcon";
import { continueCard, homeTiles } from "@/lib/home";
import type { HomeCounts, HomeTileId } from "@/lib/home";
import { onboardingHref } from "@/lib/onboarding";

const miniQuizPath = "/mini-quiz?from=home";
import type { Session } from "@/lib/session";

const tileIcons: Record<HomeTileId, LucideIcon> = {
  scenarios: Route,
  quiz: CircleHelp,
  weak: ListChecks,
  saved: Bookmark,
  guide: BookOpen,
  checklists: ClipboardCheck,
};

/**
 * Home, the learner view: a small title and the profile button, the big Continue training card
 * with the readiness ring, six tiles and the Mini-quiz. Nothing from Progress is repeated here.
 */
export function HomeView({
  directionTitle,
  unfinished,
  readiness,
  counts,
}: {
  directionTitle: string;
  unfinished: Session | null;
  /** The readiness percentage: 0 when nothing is done. */
  readiness: number;
  counts: HomeCounts;
}) {
  const card = continueCard(unfinished);
  const tiles = homeTiles(counts);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <header className="flex items-center justify-between gap-3 pt-1">
        <div className="flex min-w-0 flex-col">
          <h1 className="type-item-title">Learn</h1>
          <p className="type-small truncate text-text-secondary">{directionTitle}</p>
        </div>
        <Link
          href="/profile"
          aria-label="Profile"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-text shadow-(--card-shadow) active:bg-surface-muted"
        >
          <User size={20} strokeWidth={2} aria-hidden="true" />
        </Link>
      </header>

      <Link
        href={card.href}
        className="relative flex min-h-36 flex-col justify-between gap-4 rounded-[28px] bg-card p-5 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <ArrowCircle />
        <span className={`flex flex-col gap-1 ${ARROW_CLEARANCE.md}`}>
          <span className="type-card-title">{card.title}</span>
          <span className="type-small text-text-secondary">{card.subtitle}</span>
        </span>
        <span className="flex items-end justify-end">
          <Ring percent={readiness} size={56} label={`Readiness ${readiness}%`} />
        </span>
      </Link>

      <ul className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <li key={tile.id}>
            <Link
              href={tile.href}
              className="flex h-full min-h-32 flex-col justify-between gap-4 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
            >
              <Media3D
                variant="icon"
                fallback={<TileIcon icon={tileIcons[tile.id]} tone={tile.tone} />}
              />
              <span className="flex flex-col gap-0.5">
                <span className="type-body-strong">{tile.title}</span>
                <span className="type-small text-text-secondary">{tile.count}</span>
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
            Choose topics and 5, 10 or 15 questions
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
