"use client";

// lib/purchase-flow/useStory.ts
// The one clock behind every figure: plays a timeline once when it scrolls
// into view, and hands the figures a clock they render from. Motion is
// skipped entirely under `prefers-reduced-motion` — controls then step
// between stage snapshots.

import * as React from "react";
import { useInView, useStillness } from "@/components/iso/react/live";
import { stageIndex, type Story } from "./story";

const LONGEST_FRAME = 1 / 30;
const AUTOPLAY_DELAY = 700; // ms visible before autoplay starts

export interface StoryHandle {
  /** Attach to the figure wrapper; drives autoplay/offscreen pause. */
  anchor: React.RefObject<HTMLDivElement | null>;
  phase: number;
  playing: boolean;
  ended: boolean;
  visible: boolean;
  reduced: boolean;
  toggle(): void;
  replay(): void;
  step(): void;
  /** Re-arm: reset to zero and (unless reduced motion) autoplay again. */
  restart(): void;
}

/**
 * `draw(clock, phase)` is called on mount, whenever the scenario resets, and
 * once per frame while playing. It must not re-render React — write the DOM
 * through refs.
 *
 * Pass `anchorRef` when the caller needs the stage element for anything else
 * (the figures also set `data-*` attributes on it while drawing).
 * Set `autoplayDelayMs` to zero for an immediate, in-view start. Other figures
 * retain the default reading pause.
 */
export function useStory(
  story: Story,
  draw: (clock: number, phase: number) => void,
  anchorRef?: React.RefObject<HTMLDivElement | null>,
  autoplayDelayMs = AUTOPLAY_DELAY,
): StoryHandle {
  const ownRef = React.useRef<HTMLDivElement | null>(null);
  const anchor = anchorRef ?? ownRef;
  const reduced = useStillness();
  const visible = useInView(anchor);

  const drawRef = React.useRef(draw);
  drawRef.current = draw;

  const clockRef = React.useRef(0);
  const phaseRef = React.useRef(0);
  const rafRef = React.useRef(0);
  const lastRef = React.useRef(0);
  const playingRef = React.useRef(false);
  const endedRef = React.useRef(false);
  const autoRunRef = React.useRef(true);
  const resumeRef = React.useRef(false);
  const reducedRef = React.useRef(reduced);
  reducedRef.current = reduced;

  const [phase, setPhase] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [ended, setEnded] = React.useState(false);

  // Latest visibility, readable from callbacks without re-creating them.
  const visibleRef = React.useRef(visible);
  visibleRef.current = visible;

  const paint = React.useCallback(
    (clock: number) => {
      const index = stageIndex(story, clock);
      phaseRef.current = index;
      setPhase(index);
      drawRef.current(clock, index);
    },
    [story],
  );

  const stop = React.useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const step = React.useCallback(
    (now: number) => {
      rafRef.current = 0;
      const dt = lastRef.current ? Math.min((now - lastRef.current) / 1000, LONGEST_FRAME) : 1 / 60;
      lastRef.current = now;
      const clock = Math.min(clockRef.current + dt, story.total);
      clockRef.current = clock;
      const index = stageIndex(story, clock);
      if (index !== phaseRef.current) {
        phaseRef.current = index;
        setPhase(index);
      }
      drawRef.current(clock, index);
      if (clock >= story.total) {
        playingRef.current = false;
        endedRef.current = true;
        setPlaying(false);
        setEnded(true);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    },
    [story],
  );

  const run = React.useCallback(() => {
    if (rafRef.current) return;
    if (clockRef.current >= story.total) return;
    lastRef.current = 0;
    playingRef.current = true;
    endedRef.current = false;
    setPlaying(true);
    setEnded(false);
    rafRef.current = requestAnimationFrame(step);
  }, [step, story]);

  const reset = React.useCallback(() => {
    stop();
    clockRef.current = 0;
    endedRef.current = false;
    setEnded(false);
    paint(0);
  }, [paint, stop]);

  const play = React.useCallback(() => {
    if (reducedRef.current) {
      stop();
      clockRef.current = story.total;
      endedRef.current = true;
      paint(story.total);
      setEnded(true);
      return;
    }
    if (clockRef.current >= story.total) {
      clockRef.current = 0;
      endedRef.current = false;
      setEnded(false);
      paint(0);
    }
    run();
  }, [paint, run, stop, story]);

  const toggle = React.useCallback(() => {
    if (playingRef.current) stop();
    else play();
  }, [play, stop]);

  const replay = React.useCallback(() => {
    reset();
    if (!reducedRef.current) run();
  }, [reset, run]);

  const stepThrough = React.useCallback(() => {
    stop();
    if (clockRef.current >= story.total - 1e-3) {
      reset();
      return;
    }
    const next = phaseRef.current + 1;
    const target = next >= story.stages.length ? story.total : story.starts[next] + 1e-3;
    clockRef.current = target;
    endedRef.current = target >= story.total;
    setEnded(endedRef.current);
    paint(target);
  }, [paint, reset, stop, story]);

  const restart = React.useCallback(() => {
    reset();
    if (reducedRef.current) return;
    if (visibleRef.current) run();
    else autoRunRef.current = true;
  }, [reset, run]);

  // First paint (and whenever the story changes shape).
  React.useEffect(() => {
    paint(clockRef.current);
  }, [paint]);

  // Autoplay, pause offscreen, resume on return.
  React.useEffect(() => {
    if (visible) {
      if (resumeRef.current) {
        resumeRef.current = false;
        run();
        return;
      }
      if (autoRunRef.current && !reduced) {
        const start = () => {
          autoRunRef.current = false;
          play();
        };
        if (autoplayDelayMs === 0) {
          start();
          return;
        }
        const timer = window.setTimeout(start, autoplayDelayMs);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    resumeRef.current = playingRef.current;
    stop();
  }, [visible, reduced, play, run, stop, autoplayDelayMs]);

  React.useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { anchor, phase, playing, ended, visible, reduced, toggle, replay, step: stepThrough, restart };
}
