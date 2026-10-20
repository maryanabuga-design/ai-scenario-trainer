"use client";

import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import { Button } from "@/components/Button/Button";
import { HeroPanel } from "@/components/HeroPanel/HeroPanel";
import {
  mainLabel,
  showsSkip,
  slideLabel,
  slidesFor,
  stepLabel,
  swipeDirection,
} from "@/lib/onboarding";
import type { Role } from "@/lib/role";

/**
 * The onboarding (DESIGN.md: Onboarding screen): three slides in the hero panel layout, Skip in the
 * panel corner (slides 1 and 2), the position dots and the pinned Primary. Next, a horizontal swipe
 * and the arrow keys change the slide; focus moves to the title after a change. The slide enters
 * with a 250ms translate and fade, which the global reduced-motion rule turns off.
 */
export function OnboardingView({
  role,
  index,
  direction,
  onNext,
  onPrevious,
  onSkip,
  onFinish,
}: {
  role: Role;
  index: number;
  /** The way the last change went, for the entrance. */
  direction: "next" | "previous";
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onFinish: () => void;
}) {
  const slides = slidesFor(role);
  const slide = slides[index];
  const last = index === slides.length - 1;
  const title = useRef<HTMLHeadingElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const first = useRef(true);

  // focus moves to the new title when the slide changes (not when the screen opens)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    title.current?.focus();
  }, [index]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" && !last) onNext();
      if (event.key === "ArrowLeft" && index > 0) onPrevious();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, last, onNext, onPrevious]);

  function pointerDown(event: PointerEvent) {
    start.current = { x: event.clientX, y: event.clientY };
  }

  function pointerUp(event: PointerEvent) {
    const from = start.current;
    start.current = null;
    if (!from) return;
    const move = swipeDirection(event.clientX - from.x, event.clientY - from.y);
    if (move === "next" && !last) onNext();
    if (move === "previous" && index > 0) onPrevious();
  }

  const entrance = direction === "next" ? "slide-in-next" : "slide-in-previous";

  return (
    <div
      data-onboarding
      className="flex flex-1 touch-pan-y flex-col"
      onPointerDown={pointerDown}
      onPointerUp={pointerUp}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      <HeroPanel
        slotKey={index}
        slotClassName={entrance}
        action={
          showsSkip(index, slides.length) ? (
            <Button variant="tertiary" onClick={onSkip}>
              Skip
            </Button>
          ) : undefined
        }
      />
      <section
        key={index}
        role="group"
        aria-roledescription="slide"
        aria-label={slideLabel(index, slides.length)}
        data-slide={slide.slot}
        className={`flex flex-col items-center gap-3 px-2 pt-8 text-center ${entrance}`}
      >
        <h1 ref={title} tabIndex={-1} className="type-slide-title outline-none">
          {slide.title}
        </h1>
        <p className="type-body line-clamp-3 max-w-[320px] text-text-secondary">{slide.body}</p>
      </section>
      <div className="mt-auto flex flex-col gap-6 pt-6 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]">
        <div
          role="img"
          aria-label={stepLabel(index, slides.length)}
          className="flex items-center justify-center gap-2"
        >
          {slides.map((_, dot) => (
            <span
              key={dot}
              aria-hidden="true"
              data-dot={dot === index ? "active" : "inactive"}
              className={`h-2 rounded-full ${dot === index ? "w-6 bg-primary" : "w-2 bg-olive-tint-pressed"}`}
            />
          ))}
        </div>
        <Button onClick={last ? onFinish : onNext}>{mainLabel(index, slides.length)}</Button>
      </div>
    </div>
  );
}
