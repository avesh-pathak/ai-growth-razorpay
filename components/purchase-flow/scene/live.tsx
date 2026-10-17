"use client";

// components/purchase-flow/scene/live.tsx
// One clock, one story: the merchant storefront, the policy gate and the buyer
// desk all render from a single ScenePose each frame. The card chrome (header,
// footer, inspector) is app-side; the scene is SVG.

import * as React from "react";
import { RotateCcw, X } from "lucide-react";
import { formatPaise } from "@/lib/data/products";
import { evaluate, scenariosFor, type Evaluation, type Scenario } from "@/lib/purchase-flow/model";
import { stateLabel, type Story } from "@/lib/purchase-flow/story";
import { useStory } from "@/lib/purchase-flow/useStory";
import { cn } from "@/lib/utils";
import { CommerceArt, emptyRefs, type SceneRefs } from "./art";
import { alongPath, receiptArt, slipArt } from "./geometry";
import { poseAt, storyFor, type ScenePose } from "./pose";
import { FlowStage, Readout, ScenarioPicker, StoryControls } from "../ui";
import {
  CARD_JOIN_X,
  CARD_LIFT,
  CARD_START_X,
  CARD_Y0,
  CARD_Y1,
  CART_SLOTS,
  CART_SLOT_Z,
  CHIP_PATH,
  DOC_PATH,
  PAY_FROM,
  PAY_TO,
  QUOTE_PATH,
  REJECT_PATH,
  move,
} from "./view";

/* ------------------------------------------------------------- the painter */

interface Cache {
  slip: number;
  receipt: number;
}

const setTone = (el: Element | null, value: string) => {
  if (el) el.setAttribute("data-tone", value);
};

const setState = (el: Element | null, value: string | null) => {
  if (!el) return;
  if (value === null) el.removeAttribute("data-state");
  else el.setAttribute("data-state", value);
};

const toggle = (el: Element | null, name: string, on: boolean) => {
  if (!el) return;
  if (on) el.setAttribute(name, "");
  else el.removeAttribute(name);
};

function paint(
  host: HTMLDivElement | null,
  refs: SceneRefs,
  cache: Cache,
  scenario: Scenario,
  evaluation: Evaluation,
  pose: ScenePose,
) {
  if (host) {
    host.setAttribute("data-merchant", pose.merchant);
    host.setAttribute("data-gate", pose.gate);
    host.setAttribute("data-buyer", pose.buyer);
    host.setAttribute("data-offer", pose.offer);
    host.setAttribute("data-pay", pose.payState);
  }

  /* merchant ------------------------------------------------------------- */
  if (refs.chat) {
    refs.chat.style.opacity = pose.chat.toFixed(3);
    refs.chat.setAttribute("transform", move(0, 0, -(1 - pose.chat) * 10));
  }
  refs.cards.forEach((card, index) => {
    if (!card) return;
    const appear = pose.cards[index] ?? 0;
    const x = CARD_START_X[index]! + (CARD_JOIN_X[index]! - CARD_START_X[index]!) * pose.converge;
    const y = CARD_Y0 + (CARD_Y1 - CARD_Y0) * pose.converge;
    const z = (1 - appear) * 16 + CARD_LIFT * pose.converge;
    card.setAttribute("transform", move(x - CARD_START_X[index]!, y - CARD_Y0, z));
    card.style.opacity = appear.toFixed(3);
  });
  if (refs.bundle) {
    refs.bundle.style.opacity = pose.bundle.toFixed(3);
    refs.bundle.setAttribute("transform", move(0, 0, -(1 - pose.bundle) * 8));
  }
  if (refs.price) refs.price.style.opacity = pose.price.toFixed(3);
  if (refs.offerText) {
    refs.offerText.textContent = pose.offer === "ready" ? "ready" : pose.offer === "blocked" ? "blocked" : "pending";
    setTone(refs.offerText, pose.offer === "ready" ? "green" : pose.offer === "blocked" ? "red" : "mid");
  }
  setState(refs.offerDot, pose.offer);
  if (refs.storeText) {
    refs.storeText.textContent = pose.storeText;
    setTone(refs.storeText, pose.merchant === "ready" ? "green" : pose.merchant === "paused" ? "red" : "mid");
  }
  if (refs.cursorM) refs.cursorM.setAttribute("transform", `translate(${pose.cursorM[0].toFixed(2)} ${pose.cursorM[1].toFixed(2)})`);
  if (refs.cursorB) {
    refs.cursorB.setAttribute("transform", `translate(${pose.cursorB[0].toFixed(2)} ${pose.cursorB[1].toFixed(2)})`);
    refs.cursorB.style.opacity = pose.buyer === "idle" ? "0" : "1";
  }

  /* riders ----------------------------------------------------------------- */
  const ride = (el: SVGGElement | null, t: number, path: [number, number, number][], lift: number) => {
    if (!el) return;
    if (t < 0) {
      el.style.opacity = "0";
      return;
    }
    const [x, y, z] = alongPath(path, t, lift);
    el.setAttribute("transform", move(x, y, z));
    el.style.opacity = t > 0.94 ? Math.max(0, (1 - t) / 0.06).toFixed(3) : "1";
  };
  ride(refs.doc, pose.doc, pose.docBack ? QUOTE_PATH : DOC_PATH, pose.docBack ? 18 : 26);
  ride(refs.chip, pose.chip, pose.chipRejected ? REJECT_PATH : CHIP_PATH, 22);
  toggle(refs.chip, "data-red", pose.chipRejected);
  toggle(refs.flowOut, "data-flow", pose.flowOut);
  toggle(refs.flowBack, "data-flow", pose.flowBack);

  /* gate ------------------------------------------------------------------- */
  refs.dots.forEach((dot, index) => {
    const resolved = index < Math.floor(pose.reveal + 1e-6);
    setState(dot, resolved ? evaluation.rules[index]!.status : "pending");
  });
  refs.mandateDots.forEach((dot) => setState(dot, pose.reveal >= 1 ? evaluation.rules[0]!.status : "pending"));
  if (refs.shieldCheck) refs.shieldCheck.style.opacity = pose.shield.toFixed(3);
  if (refs.shieldFill) refs.shieldFill.style.opacity = (pose.shield * 0.16).toFixed(3);
  if (refs.gateText) {
    refs.gateText.textContent = pose.gateText;
    setTone(refs.gateText, pose.gateText === "approved" ? "green" : pose.gateText === "blocked" ? "red" : "mid");
  }
  if (refs.reason) refs.reason.style.opacity = (0.42 + 0.58 * pose.reason).toFixed(3);
  if (refs.slip) {
    if (pose.slip > 0.004) {
      if (Math.abs(pose.slip - cache.slip) > 0.02) {
        refs.slip.innerHTML = slipArt(pose.slip, scenario);
        cache.slip = pose.slip;
      }
      refs.slip.style.opacity = "1";
    } else if (cache.slip !== -1) {
      refs.slip.innerHTML = "";
      refs.slip.style.opacity = "0";
      cache.slip = -1;
    }
  }

  /* buyer -------------------------------------------------------------------- */
  refs.tiles.forEach((tile, index) => {
    if (!tile) return;
    const t = Math.max(0, Math.min(1, pose.tiles - index));
    tile.style.opacity = t.toFixed(3);
    tile.setAttribute("transform", move(0, 0, (1 - t) * 12));
  });
  refs.tokens.forEach((token, index) => {
    if (!token) return;
    const t = Math.max(0, Math.min(1, pose.cartItems - index));
    const [sx, sy] = CART_SLOTS[index]!;
    const x = sx + 6 * (1 - t);
    const y = sy - 54 * (1 - t) + 2 * t;
    const z = 104 + (CART_SLOT_Z - 104) * t + 8 * Math.sin(Math.PI * t);
    token.setAttribute("transform", move(x, y, z));
    token.style.opacity = Math.min(1, t * 2.4).toFixed(3);
  });
  if (refs.cartCount) refs.cartCount.textContent = `×${Math.min(6, Math.round(pose.cartItems))}`;
  if (refs.quote) {
    refs.quote.style.opacity = pose.quote.toFixed(3);
    refs.quote.setAttribute("transform", move(0, 0, -(1 - pose.quote) * 12));
  }
  if (refs.budgetFill) refs.budgetFill.setAttribute("width", (72 * pose.budget).toFixed(2));
  toggle(refs.budget, "data-over", pose.over);
  if (refs.payText) {
    refs.payText.textContent = pose.payText;
    setTone(refs.payText, pose.payState === "paid" ? "green" : pose.payState === "declined" ? "red" : "mid");
  }
  if (refs.card) {
    if (pose.pay < 0) {
      refs.card.style.opacity = "0";
    } else {
      const t = pose.pay;
      const x = PAY_FROM[0] + (PAY_TO[0] - PAY_FROM[0]) * t;
      const y = PAY_FROM[1] + (PAY_TO[1] - PAY_FROM[1]) * t;
      const z = PAY_FROM[2] + (PAY_TO[2] - PAY_FROM[2]) * t;
      refs.card.setAttribute("transform", move(x, y, z));
      const fade = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 1;
      refs.card.style.opacity = (Math.min(1, t * 6) * fade).toFixed(3);
    }
  }
  if (refs.receipt) {
    if (pose.receipt > 0.004) {
      if (Math.abs(pose.receipt - cache.receipt) > 0.02) {
        refs.receipt.innerHTML = receiptArt(pose.receipt, scenario, evaluation.totalPaise);
        cache.receipt = pose.receipt;
      }
      // The receipt keeps its paper at rest — it is the artifact the whole
      // story is about. Replay resets the scene wholesale, so no fade needed.
      refs.receipt.style.opacity = Math.min(1, pose.receipt * 4).toFixed(3);
    } else if (cache.receipt !== -1) {
      refs.receipt.innerHTML = "";
      refs.receipt.style.opacity = "0";
      cache.receipt = -1;
    }
  }
}

/* ------------------------------------------------------------------ hook */

function useScene(scenario: Scenario) {
  const evaluation = React.useMemo(() => evaluate(scenario), [scenario]);
  const story = React.useMemo(() => storyFor(scenario, evaluation), [scenario, evaluation]);
  const refs = React.useMemo(() => emptyRefs(), []);
  const cache = React.useRef<Cache>({ slip: -1, receipt: -1 });
  const hostRef = React.useRef<HTMLDivElement | null>(null);

  const draw = React.useCallback(
    (clock: number) => {
      const pose = poseAt(scenario, evaluation, story, clock);
      paint(hostRef.current, refs, cache.current, scenario, evaluation, pose);
    },
    [scenario, evaluation, story, refs],
  );

  const handle = useStory(story, draw, hostRef);
  return { evaluation, story, refs, handle, hostRef };
}

/* --------------------------------------------------------------- inspector */

type Zone = "merchant" | "gate" | "buyer";

function zoneRows(zone: Zone, scenario: Scenario, evaluation: Evaluation, pose: ScenePose, story: Story, phase: number) {
  const lines = evaluation.lines.length;
  const stage = story.stages[Math.min(phase, story.stages.length - 1)];
  if (zone === "merchant") {
    return [
      { label: "Stage", value: `${stage?.label ?? "—"} · ${stage?.event ?? ""}`, tone: "muted" as const },
      { label: "Request", value: "“help me build a pour-over setup”" },
      { label: "Bundle", value: `${lines} items · ${formatPaise(evaluation.totalPaise)}` },
      {
        label: "Offer",
        value: pose.offer === "ready" ? "ready for the buyer" : pose.offer === "blocked" ? "not cleared" : "awaiting gate",
        tone: pose.offer === "ready" ? ("ok" as const) : pose.offer === "blocked" ? ("bad" as const) : ("muted" as const),
      },
    ];
  }
  if (zone === "gate") {
    const engagement =
      stage?.id === "screen"
        ? "proposal review"
        : stage?.id === "checkout"
          ? "checkout authorization"
          : stage?.id === "decision"
            ? "proposal cleared"
            : stage?.id === "rejected"
              ? "proposal refused"
              : "idle";
    const determining = evaluation.failedIndex >= 0 ? evaluation.rules[evaluation.failedIndex]?.short ?? "—" : "—";
    return [
      { label: "Engagement", value: engagement },
      {
        label: "Verdict",
        value: evaluation.verdict,
        tone: evaluation.verdict === "approved" ? ("ok" as const) : ("bad" as const),
      },
      { label: "Determining", value: determining, tone: determining === "—" ? ("muted" as const) : ("bad" as const) },
      { label: "Reason code", value: evaluation.reasonCode ?? "none" },
      { label: "Reason", value: evaluation.reasonText, tone: "muted" as const },
    ];
  }
  const capPaise = Math.min(scenario.merchant.perOrderPaise, scenario.buyer.perOrderPaise);
  const over = evaluation.totalPaise > capPaise;
  return [
    { label: "Cart", value: `${Math.round(pose.cartItems)} items` },
    { label: "Quote", value: `${scenario.quote} · ${formatPaise(evaluation.totalPaise)}` },
    {
      label: "Mandate",
      value: over ? `over ${scenario.buyer.id} cap by ${formatPaise(evaluation.totalPaise - capPaise)}` : `within ${scenario.buyer.id} cap`,
      tone: over ? ("bad" as const) : ("ok" as const),
    },
    { label: "Checkout", value: pose.payText, tone: "muted" as const },
    {
      label: "Payment",
      value: pose.payState === "idle" ? "not attempted" : pose.payState,
      tone: pose.payState === "paid" ? ("ok" as const) : pose.payState === "declined" ? ("bad" as const) : ("muted" as const),
    },
    {
      label: "Receipt",
      value: scenario.payment === "failed" ? "not issued" : pose.receipt > 0 ? scenario.receipt : "pending",
      tone: scenario.payment === "failed" ? ("bad" as const) : ("muted" as const),
    },
  ];
}

function Inspector({
  zone,
  scenario,
  evaluation,
  pose,
  story,
  phase,
  onClose,
}: {
  zone: Zone;
  scenario: Scenario;
  evaluation: Evaluation;
  pose: ScenePose;
  story: Story;
  phase: number;
  onClose: () => void;
}) {
  const rows = zoneRows(zone, scenario, evaluation, pose, story, phase);
  const title = zone === "merchant" ? "Merchant agent" : zone === "gate" ? "Policy gate" : "Buyer agent";
  return (
    <div
      role="region"
      aria-label={`${title} details`}
      className={cn(
        "sc-inspector rounded-xl border border-border bg-card p-3.5 shadow-xl",
        zone === "merchant" && "sc-inspector-left",
        zone === "gate" && "sc-inspector-center",
        zone === "buyer" && "sc-inspector-right",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title} details`}
          className="ml-auto rounded-md p-0.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-2.5">
        <Readout rows={rows} />
      </div>
      {zone === "gate" ? (
        <ul role="list" className="mt-2.5 space-y-1 rounded-xl border border-border bg-muted/40 px-3.5 py-3">
          {evaluation.rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2 font-mono text-[11px] leading-[1.5]">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  rule.status === "passed" && "bg-[var(--positive)]",
                  rule.status === "failed" && "bg-[var(--destructive)]",
                  rule.status === "skipped" && "border border-muted-foreground/50",
                  rule.status === "pending" && "bg-muted-foreground/30",
                )}
              />
              <span className="text-foreground">{rule.short}</span>
              <span className={cn("ml-auto text-muted-foreground", rule.status === "failed" && "text-[var(--destructive)]")}>
                {rule.status === "failed" ? rule.code : rule.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- card */

export function CommerceScene({ hero = false }: { hero?: boolean }) {
  const scenarios = React.useMemo(() => scenariosFor("buyer"), []);
  const [scenarioId, setScenarioId] = React.useState(scenarios[0]!.id);
  const scenario = scenarios.find((entry) => entry.id === scenarioId) ?? scenarios[0]!;
  const { evaluation, story, refs, handle } = useScene(scenario);
  const [inspecting, setInspecting] = React.useState<Zone | null>(null);

  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setInspecting(null);
    handle.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  // The hero runs the whole three-scenario reel on its own.
  React.useEffect(() => {
    if (!hero || !handle.ended) return;
    const timer = window.setTimeout(() => {
      const index = scenarios.findIndex((entry) => entry.id === scenarioId);
      setScenarioId(scenarios[(index + 1) % scenarios.length]!.id);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [hero, handle.ended, scenarioId, scenarios]);

  React.useEffect(() => {
    if (!inspecting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInspecting(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspecting]);

  const phase = Math.min(handle.phase, story.stages.length - 1);
  const stage = story.stages[phase]!;
  const label = stateLabel(story, handle.phase, scenario, evaluation, handle.ended);
  const outcome = handle.ended ? (scenario.payment === "failed" ? "payment failed" : evaluation.verdict) : null;

  // Inspector values sample the current stage near its end — same model as the clock.
  const inspectPose = React.useMemo(
    () => poseAt(scenario, evaluation, story, story.starts[phase]! + story.stages[phase]!.dur * 0.9),
    [scenario, evaluation, story, phase],
  );

  return (
    <div className={cn("flex flex-col", hero ? "gap-0" : "gap-4")}>
      {!hero ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ScenarioPicker scenarios={scenarios} value={scenario.id} onChange={setScenarioId} label="Scenario" />
          <p className="max-w-[30rem] text-[13px] leading-[1.5] text-muted-foreground">{scenario.blurb}</p>
        </div>
      ) : null}

      <div className="sc-frame overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
          <span className={cn("sc-led size-2 shrink-0 rounded-full bg-muted-foreground/40")} data-on={handle.playing && !handle.reduced ? "" : undefined} />
          <span className="min-w-0 truncate whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Agentic Commerce<span className="hidden sm:inline"> — Live Simulation</span>
          </span>
          <span
            className={cn(
              "ml-auto rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.12em]",
              label === "Blocked" || label === "Failed" || label === "Payment failed"
                ? "border-[var(--destructive)]/40 text-[var(--destructive)]"
                : label === "Completed"
                  ? "border-[var(--positive)]/40 text-[var(--positive)]"
                  : "border-border text-muted-foreground",
            )}
          >
            {label}
          </span>
        </header>

        <div className="sc-view relative">
          <FlowStage anchor={handle.anchor} className="sc-stage">
            <CommerceArt scenario={scenario} evaluation={evaluation} refs={refs} />
          </FlowStage>
          {!hero ? (
            <>
              <div className="sc-zones">
                {(["merchant", "gate", "buyer"] as const).map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    aria-label={`Inspect the ${zone === "merchant" ? "merchant agent" : zone === "gate" ? "policy gate" : "buyer agent"}`}
                    aria-pressed={inspecting === zone}
                    onClick={() => setInspecting((value) => (value === zone ? null : zone))}
                    className={cn("sc-zone", `sc-zone-${zone}`)}
                  />
                ))}
              </div>
              {inspecting ? (
                <Inspector
                  zone={inspecting}
                  scenario={scenario}
                  evaluation={evaluation}
                  pose={inspectPose}
                  story={story}
                  phase={handle.phase}
                  onClose={() => setInspecting(null)}
                />
              ) : null}
            </>
          ) : null}
        </div>

        <footer className="flex items-center gap-3 border-t border-border px-4 py-2.5 font-mono text-[11px]">
          <span className="shrink-0 text-muted-foreground">audit ▸</span>
          <span className="min-w-0 truncate text-foreground">{stage.event}</span>
          {outcome ? (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]",
                outcome === "approved" ? "border-[var(--positive)]/40 text-[var(--positive)]" : "border-[var(--destructive)]/40 text-[var(--destructive)]",
              )}
            >
              {outcome}
            </span>
          ) : null}
          <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
            {String(phase + 1).padStart(2, "0")} / {String(story.stages.length).padStart(2, "0")}
          </span>
          {!hero ? (
            <button
              type="button"
              onClick={handle.replay}
              aria-label="Replay the simulation"
              className="shrink-0 rounded-md p-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <RotateCcw className="size-3.5" />
            </button>
          ) : null}
        </footer>
      </div>

      {!hero ? (
        <div className="flex flex-wrap items-center gap-3">
          <StoryControls
            playing={handle.playing}
            ended={handle.ended}
            reduced={handle.reduced}
            onToggle={handle.toggle}
            onStep={handle.step}
            onReplay={handle.replay}
          />
          <span className="text-[12px] text-muted-foreground lg:ml-auto">
            Click a station to inspect its live state — merchant, gate, buyer.
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function CommerceHero() {
  return <CommerceScene hero />;
}
