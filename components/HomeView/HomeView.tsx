"use client";

import { Bookmark, ClipboardCheck, ListChecks, ListOrdered, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { TileIcon } from "@/components/TileIcon/TileIcon";
import { HERO_BUTTON_LABEL, HERO_SUBTITLE, HERO_TITLE, homeImages, homeTiles } from "@/lib/home";
import type { HomeCounts, HomeSummary, HomeTileId } from "@/lib/home";

const miniQuizPath = "/mini-quiz?from=home";

const tileIcons: Record<HomeTileId, LucideIcon> = {
  exam: ClipboardCheck,
  steps: ListOrdered,
  weak: ListChecks,
  saved: Bookmark,
};

/**
 * Home, the learner view: a greeting with one sentence and the profile button, the hero card (its
 * one Primary button opens Training), four tiles and the Mini-quiz row. Nothing from Progress is
 * repeated here, and no readiness percentage.
 */
export function HomeView({
  name,
  summary,
  counts,
}: {
  name: string;
  summary: HomeSummary;
  counts: HomeCounts;
}) {
  const tiles = homeTiles(counts);

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

      <section
        aria-label={HERO_TITLE}
        className="relative rounded-[28px] bg-card p-2 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <div className="flex flex-col gap-4 rounded-[22px] bg-secondary-sand p-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="type-card-title">{HERO_TITLE}</h2>
              <p className="type-small text-text-secondary">{HERO_SUBTITLE}</p>
            </div>
            <Media3D variant="tile" src={homeImages.heroTraining} />
          </div>

          <Link
            href="/training"
            className={`${buttonClasses({ variant: "primary" })} after:absolute after:inset-0 after:rounded-[28px]`}
          >
            {HERO_BUTTON_LABEL}
          </Link>
        </div>
      </section>

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
        className="flex min-h-[104px] items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
      >
        <Media3D variant="row" src={homeImages.iconMiniQuiz} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-strong">Mini-quiz</span>
          <span className="type-small line-clamp-2 text-text-secondary">
            Pick topics and how many questions
          </span>
        </span>
        <Chevron />
      </Link>
    </div>
  );
}
