"use client";

// components/purchase-flow/ui.tsx
// The app-side chrome around each figure: the stage frame (theme-wired),
// scenario chips, story controls, and the live readout strip. All of it uses
// the app's card language so the figures read as part of the page.

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import type { Scenario } from "@/lib/purchase-flow/model";
import type { ReadoutRow } from "@/lib/purchase-flow/story";

import "@/components/iso/iso.css";
import "./flow.css";

export function FlowStage({
  anchor,
  children,
  className,
}: {
  anchor: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  className?: string;
}) {
  const { theme } = useTheme();
  return (
    <div ref={anchor} className={cn("iso flowfig", className)} data-theme={theme}>
      {children}
    </div>
  );
}

export function ScenarioPicker({
  scenarios,
  value,
  onChange,
  label,
}: {
  scenarios: Scenario[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {scenarios.map((scenario) => {
        const active = scenario.id === value;
        return (
          <button
            key={scenario.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(scenario.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors outline-none max-sm:min-h-11",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-brand/50 bg-brand/10 text-foreground"
                : "border-border text-muted-foreground hover:border-brand/30 hover:text-foreground",
            )}
          >
            {scenario.label}
          </button>
        );
      })}
    </div>
  );
}

export function StoryControls({
  playing,
  ended,
  reduced,
  onToggle,
  onStep,
  onReplay,
}: {
  playing: boolean;
  ended: boolean;
  reduced: boolean;
  onToggle: () => void;
  onStep: () => void;
  onReplay: () => void;
}) {
  const primaryLabel = playing ? "Pause" : reduced ? (ended ? "Replay" : "Skip to result") : ended ? "Play again" : "Play";
  const primaryAction = ended && reduced ? onReplay : onToggle;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={primaryAction}>
        {primaryLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={onStep}>
        Step
      </Button>
      <Button variant="ghost" size="sm" onClick={onReplay}>
        Restart
      </Button>
      <span className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
        {reduced ? "Reduced motion · steps jump to snapshots" : "Plays once when in view · pauses when offscreen"}
      </span>
    </div>
  );
}

export function Readout({ rows }: { rows: ReadoutRow[] }) {
  return (
    <dl
      aria-live="polite"
      className="grid gap-1.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 font-mono text-[11.5px] leading-[1.6]"
    >
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="shrink-0 tracking-[0.14em] text-muted-foreground uppercase">{row.label}</dt>
          <dd
            className={cn(
              "text-right tabular-nums",
              row.tone === "ok" && "text-[var(--positive)]",
              row.tone === "bad" && "text-[var(--destructive)]",
              row.tone === "muted" && "text-muted-foreground",
              !row.tone && "text-foreground",
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
