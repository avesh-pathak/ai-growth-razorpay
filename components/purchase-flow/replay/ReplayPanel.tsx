"use client";

// components/purchase-flow/replay/ReplayPanel.tsx
// "How a purchase flows" — a live transaction replay. Miniature product UI
// (merchant console → policy gate → buyer console → checkout → receipt)
// driven by one deterministic clock. The hero keeps the isometric figure;
// this panel is intentionally software, not scenery.

import * as React from "react";
import { Check, ShieldCheck, ShoppingCart, Store, X } from "lucide-react";
import { formatPaise } from "@/lib/data/products";
import { RULES, evaluate, scenariosFor } from "@/lib/purchase-flow/model";
import { makeStory, stagesFor, stateLabel } from "@/lib/purchase-flow/story";
import { useStory } from "@/lib/purchase-flow/useStory";
import { cn } from "@/lib/utils";
import { ScenarioPicker } from "../ui";
import {
  CHECK_WORD,
  GATE_WORD,
  OFFER_WORD,
  PAY_WORD,
  contextLine,
  frameAt,
  stageKind,
  statusTone,
  type ReplayFrame,
} from "./frame";

import "./replay.css";

/* ------------------------------------------------------------- refs bag */

interface ReplayRefs {
  merchantPane: HTMLDivElement | null;
  buyerPane: HTMLDivElement | null;
  msgText: HTMLSpanElement | null;
  msgCaret: HTMLSpanElement | null;
  replyRow: HTMLDivElement | null;
  replyText: HTMLSpanElement | null;
  replyCaret: HTMLSpanElement | null;
  sysRow: HTMLDivElement | null;
  cards: (HTMLDivElement | null)[];
  bundleCard: HTMLDivElement | null;
  bundleTotal: HTMLSpanElement | null;
  offerChip: HTMLSpanElement | null;
  gateChip: HTMLSpanElement | null;
  ruleRows: (HTMLLIElement | null)[];
  ruleWords: (HTMLSpanElement | null)[];
  reasonBox: HTMLDivElement | null;
  catRows: (HTMLDivElement | null)[];
  catCount: HTMLSpanElement | null;
  cartRows: (HTMLDivElement | null)[];
  cartCount: HTMLSpanElement | null;
  cartTag: HTMLSpanElement | null;
  provTotal: HTMLSpanElement | null;
  quoteCard: HTMLDivElement | null;
  quoteTotal: HTMLSpanElement | null;
  quoteStamp: HTMLSpanElement | null;
  mandateChips: (HTMLDivElement | null)[];
  checkoutState: HTMLSpanElement | null;
  payCard: HTMLDivElement | null;
  payStatus: HTMLSpanElement | null;
  payBar: HTMLDivElement | null;
  declineNote: HTMLDivElement | null;
  receiptWrap: HTMLDivElement | null;
  ruleNow: HTMLSpanElement | null;
}

const emptyRefs = (): ReplayRefs => ({
  merchantPane: null,
  buyerPane: null,
  msgText: null,
  msgCaret: null,
  replyRow: null,
  replyText: null,
  replyCaret: null,
  sysRow: null,
  cards: [],
  bundleCard: null,
  bundleTotal: null,
  offerChip: null,
  gateChip: null,
  ruleRows: [],
  ruleWords: [],
  reasonBox: null,
  catRows: [],
  catCount: null,
  cartRows: [],
  cartCount: null,
  cartTag: null,
  provTotal: null,
  quoteCard: null,
  quoteTotal: null,
  quoteStamp: null,
  mandateChips: [],
  checkoutState: null,
  payCard: null,
  payStatus: null,
  payBar: null,
  declineNote: null,
  receiptWrap: null,
  ruleNow: null,
});

/* -------------------------------------------------------------- the painter */

const setOpacity = (el: HTMLElement | null, value: number) => {
  if (el) el.style.opacity = value.toFixed(3);
};

function eventTone(event: string, live: boolean): string {
  if (live) return "live";
  if (/blocked|failed|declined/.test(event)) return "destructive";
  if (/approved|succeeded|issued|cleared/.test(event)) return "positive";
  return "muted";
}

function paint(refs: ReplayRefs, frame: ReplayFrame) {
  /* panes */
  setOpacity(refs.merchantPane, frame.merchantVis);
  setOpacity(refs.buyerPane, frame.buyerVis);

  /* merchant */
  if (refs.msgText) refs.msgText.textContent = frame.msgText;
  if (refs.msgCaret) refs.msgCaret.style.visibility = frame.msgTyping ? "visible" : "hidden";
  if (refs.replyRow) {
    refs.replyRow.style.opacity = frame.replyVis.toFixed(3);
    refs.replyRow.style.transform = `translateY(${((1 - frame.replyVis) * 6).toFixed(2)}px)`;
  }
  if (refs.replyText) refs.replyText.textContent = frame.replyText;
  if (refs.replyCaret) refs.replyCaret.style.visibility = frame.replyTyping ? "visible" : "hidden";
  setOpacity(refs.sysRow, frame.sysVis);
  frame.cards.forEach((t, k) => {
    const el = refs.cards[k];
    if (!el) return;
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translateY(${((1 - t) * 10).toFixed(2)}px)`;
  });
  if (refs.bundleCard) {
    refs.bundleCard.style.opacity = frame.bundleVis.toFixed(3);
    refs.bundleCard.style.transform = `translateY(${((1 - frame.bundleVis) * 10).toFixed(2)}px)`;
  }
  if (refs.bundleTotal) refs.bundleTotal.textContent = formatPaise(frame.bundleTotalPaise);
  if (refs.offerChip) {
    refs.offerChip.dataset.state = frame.offer;
    refs.offerChip.textContent = OFFER_WORD[frame.offer];
  }

  /* gate */
  if (refs.gateChip) {
    refs.gateChip.dataset.state = frame.gateVerdict;
    refs.gateChip.textContent = GATE_WORD[frame.gateVerdict];
  }
  frame.checks.forEach((state, r) => {
    const row = refs.ruleRows[r];
    if (row) row.dataset.state = state;
    const word = refs.ruleWords[r];
    if (word) word.textContent = CHECK_WORD[state];
  });
  setOpacity(refs.reasonBox, frame.reasonVis);

  /* buyer */
  frame.catRows.forEach((t, k) => {
    const el = refs.catRows[k];
    if (!el) return;
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translateY(${((1 - t) * 8).toFixed(2)}px)`;
    el.dataset.picked = (frame.picked[k] ?? 0) > 0.5 ? "true" : "false";
  });
  if (refs.catCount) refs.catCount.textContent = `fetched ${frame.catFetched}/${refs.catRows.length}`;
  frame.cartRows.forEach((t, k) => {
    const el = refs.cartRows[k];
    if (!el) return;
    el.style.opacity = t.toFixed(3);
    el.style.transform = `translateX(${((1 - t) * -12).toFixed(2)}px)`;
  });
  if (refs.cartCount) refs.cartCount.textContent = `${frame.cartItems} ${frame.cartItems === 1 ? "item" : "items"}`;
  if (refs.cartTag) {
    refs.cartTag.dataset.state = frame.authoritative ? "buyable" : "review";
    refs.cartTag.textContent = frame.authoritative ? "quoted" : "provisional";
  }
  if (refs.provTotal) refs.provTotal.textContent = formatPaise(frame.provisionalPaise);
  if (refs.quoteCard) {
    refs.quoteCard.style.opacity = frame.quoteVis.toFixed(3);
    refs.quoteCard.style.transform = `translateY(${((1 - frame.quoteVis) * 8).toFixed(2)}px)`;
  }
  if (refs.quoteTotal) refs.quoteTotal.textContent = formatPaise(frame.quoteTotalPaise);
  setOpacity(refs.quoteStamp, frame.quoteStamp);
  frame.mandates.forEach((t, k) => {
    const el = refs.mandateChips[k];
    if (!el) return;
    el.style.opacity = t.toFixed(3);
    el.style.transform = `scale(${(0.96 + t * 0.04).toFixed(3)})`;
  });
  if (refs.checkoutState) {
    refs.checkoutState.dataset.state = frame.authorized ? "buyable" : "draft";
    refs.checkoutState.textContent = frame.authorized ? "authorized" : "pending";
  }
  if (refs.payCard) {
    refs.payCard.style.opacity = frame.payVis.toFixed(3);
    refs.payCard.style.transform = `translateY(${((1 - frame.payVis) * 8).toFixed(2)}px)`;
  }
  if (refs.payStatus) {
    refs.payStatus.dataset.state = frame.payState === "idle" ? "draft" : frame.payState;
    refs.payStatus.textContent = PAY_WORD[frame.payState];
  }
  if (refs.payBar) refs.payBar.style.width = `${(frame.payBar * 100).toFixed(2)}%`;
  setOpacity(refs.declineNote, frame.declineVis);
  if (refs.receiptWrap) {
    refs.receiptWrap.style.transformOrigin = "50% 0%";
    refs.receiptWrap.style.opacity = frame.receiptVis.toFixed(3);
    refs.receiptWrap.style.transform = `scaleY(${frame.receiptVis.toFixed(4)})`;
  }

  if (refs.ruleNow) refs.ruleNow.textContent = frame.ruleNow;
}

/* ---------------------------------------------------------------- pieces */

function PanelHead({ title, hint }: { title: string; hint?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="rp-mono text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{title}</span>
      {hint != null &&
        (typeof hint === "string" ? (
          <span className="rp-mono text-[10.5px] text-muted-foreground">{hint}</span>
        ) : (
          hint
        ))}
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="rp-mono truncate text-right text-foreground">{value}</dd>
    </div>
  );
}

/* ------------------------------------------------------------------ panel */

export function ReplayPanel() {
  const scenarios = React.useMemo(() => scenariosFor("buyer"), []);
  const [scenarioId, setScenarioId] = React.useState(() => scenarios[0]!.id);
  const scenario = scenarios.find((entry) => entry.id === scenarioId) ?? scenarios[0]!;
  const evaluation = React.useMemo(() => evaluate(scenario), [scenario]);
  const story = React.useMemo(() => makeStory(stagesFor(scenario, evaluation)), [scenario, evaluation]);
  const refs = React.useMemo(() => emptyRefs(), []);

  const draw = React.useCallback(
    (clock: number) => {
      paint(refs, frameAt(scenario, evaluation, story, clock));
    },
    [refs, scenario, evaluation, story],
  );

  const handle = useStory(story, draw);

  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    handle.restart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  // The section runs an endless reel: hold the final frame, then play again.
  React.useEffect(() => {
    if (handle.reduced || !handle.visible || !handle.ended) return;
    const timer = window.setTimeout(() => handle.replay(), 2400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle.reduced, handle.visible, handle.ended, handle.replay]);

  // Reduced motion: no clock at all — settle on the end frame.
  React.useEffect(() => {
    if (handle.reduced) handle.toggle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle.reduced, handle.toggle]);

  const phase = Math.min(handle.phase, story.stages.length - 1);
  const stage = story.stages[phase]!;
  const tab = stageKind(stage.id);
  const status = stateLabel(story, handle.phase, scenario, evaluation, handle.ended);
  const tone = statusTone(scenario, evaluation, handle.ended);
  const context = contextLine(scenario, evaluation, story, phase);
  const events = story.stages.slice(0, phase + 1);
  const lines = evaluation.lines;
  const failedRule = evaluation.rules[evaluation.failedIndex];
  const live = handle.playing && !handle.reduced;

  return (
    <div ref={handle.anchor} className="rp-runtime" role="region" aria-label="Live purchase simulation">
      {/* top strip */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rp-led" data-on={live ? "true" : "false"} />
          <span className="rp-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            Purchase simulation
          </span>
          <span className="rp-chip" data-state={tone === "positive" ? "approved" : tone === "destructive" ? "blocked" : "review"}>
            {status}
          </span>
        </div>
        <ScenarioPicker scenarios={scenarios} value={scenario.id} onChange={setScenarioId} label="Scenario" />
      </div>

      {/* the runtime window */}
      <div className="rp-window mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* window bar */}
        <div className="rp-window-bar flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
          <span className="text-[12px] text-muted-foreground">Test mode · no real money</span>
          <div
            role="group"
            aria-label="Active workspace"
            className="ml-auto flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/50 p-1"
          >
            {(
              [
                ["merchant", "Merchant agent", Store],
                ["gate", "Policy gate", ShieldCheck],
                ["buyer", "Buyer agent", ShoppingCart],
              ] as const
            ).map(([key, label, Icon]) => (
              <span
                key={key}
                data-workspace={key}
                aria-current={tab === key ? "true" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors sm:text-[12px]",
                  tab === key
                    ? "bg-card text-foreground shadow-sm ring-1 ring-brand/40"
                    : "text-muted-foreground",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("size-3.5 shrink-0", tab === key ? "text-brand" : "text-muted-foreground")}
                  strokeWidth={2.25}
                />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* body */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px]">
          {/* main stage */}
          <div className="relative grid min-h-[480px]">
            {/* merchant pane */}
            <div
              ref={(el) => {
                refs.merchantPane = el;
              }}
              className="rp-pane rp-merchant col-start-1 row-start-1 grid content-start gap-4 overflow-hidden p-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:p-5"
            >
              <div className="flex flex-col gap-2.5">
                <PanelHead title="The request" />
                <div className="rp-conversation flex flex-1 flex-col justify-end rounded-xl border border-border bg-muted/30 p-3">
                  <div className="max-w-[94%] rounded-xl rounded-bl-sm border border-border bg-card px-3 py-2">
                    <div className="rp-mono text-[10.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase">Shopper</div>
                    <p className="mt-1 text-[12.5px] leading-[1.5] text-foreground">
                      <span
                        ref={(el) => {
                          refs.msgText = el;
                        }}
                      />
                      <span
                        ref={(el) => {
                          refs.msgCaret = el;
                        }}
                        className="rp-caret"
                      />
                    </p>
                  </div>
                  <div
                    ref={(el) => {
                      refs.replyRow = el;
                    }}
                    className="mt-2.5 ml-auto max-w-[94%] rounded-xl rounded-br-sm border border-brand/25 bg-brand/[0.05] px-3 py-2"
                  >
                    <div className="rp-mono text-[10.5px] font-medium tracking-[0.1em] text-brand uppercase">Merchant agent</div>
                    <p className="mt-1 text-[12.5px] leading-[1.5] text-foreground">
                      <span
                        ref={(el) => {
                          refs.replyText = el;
                        }}
                      />
                      <span
                        ref={(el) => {
                          refs.replyCaret = el;
                        }}
                        className="rp-caret"
                      />
                    </p>
                  </div>
                  <div
                    ref={(el) => {
                      refs.sysRow = el;
                    }}
                    className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-[12px] leading-[1.4] text-muted-foreground">
                      Sent for policy review
                    </span>
                  </div>
                </div>
                <div
                  ref={(el) => {
                    refs.bundleCard = el;
                  }}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-foreground">{lines.length}-item proposal</span>
                    <span
                      ref={(el) => {
                        refs.offerChip = el;
                      }}
                      className="rp-chip"
                    >
                      draft
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                    <span className="text-[12px] text-muted-foreground">Proposed total</span>
                    <span
                      ref={(el) => {
                        refs.bundleTotal = el;
                      }}
                      className="rp-mono text-[13px] font-medium text-foreground"
                    >
                      ₹0.00
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <PanelHead title="The bundle" hint={`${lines.length} items`} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {lines.map((line, k) => (
                    <div
                      key={line.sku}
                      ref={(el) => {
                        refs.cards[k] = el;
                      }}
                      className="rp-product rounded-lg border border-border bg-card p-2.5"
                      data-category={line.category.toLowerCase()}
                    >
                      <div className="truncate text-[12px] font-medium text-foreground">{line.short}</div>
                      <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground capitalize">{line.category}</div>
                      <div className="rp-mono mt-1.5 text-[11.5px] text-foreground">{formatPaise(line.unitPaise)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* buyer pane */}
            <div
              ref={(el) => {
                refs.buyerPane = el;
              }}
              className="rp-pane rp-buyer col-start-1 row-start-1 grid content-start gap-4 overflow-hidden p-4 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] sm:p-5"
            >
              <div className="flex flex-col gap-2.5">
                <PanelHead
                  title="Buyer selection"
                  hint={
                    <span
                      ref={(el) => {
                        refs.catCount = el;
                      }}
                      className="rp-mono text-[10.5px] text-muted-foreground"
                    >
                      fetched 0/6
                    </span>
                  }
                />
                <div className="rounded-xl border border-border bg-muted/30 p-1.5">
                  {lines.map((line, k) => (
                    <div
                      key={line.sku}
                      ref={(el) => {
                        refs.catRows[k] = el;
                      }}
                      className="rp-row flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                    >
                      <Check className="rp-pick size-3.5" strokeWidth={2.5} />
                      <span className="rp-row-main">
                        <span className="w-16 truncate text-[12.5px] font-medium text-foreground">{line.short}</span>
                        <span className="rp-mono flex-1 truncate text-[10.5px] text-muted-foreground">
                          {line.sku} · {line.category}
                        </span>
                        <span className="rp-mono shrink-0 text-[11.5px] text-foreground">{formatPaise(line.unitPaise)}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-foreground">Cart</span>
                    <span className="flex items-center gap-1.5">
                      <span
                        ref={(el) => {
                          refs.cartCount = el;
                        }}
                        className="rp-mono text-[10.5px] text-muted-foreground"
                      >
                        0 items
                      </span>
                      <span
                        ref={(el) => {
                          refs.cartTag = el;
                        }}
                        className="rp-chip"
                      >
                        provisional
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5">
                    {lines.map((line, k) => (
                      <div
                        key={line.sku}
                        ref={(el) => {
                          refs.cartRows[k] = el;
                        }}
                        className="flex items-baseline justify-between gap-2 text-[12px]"
                      >
                        <span className="truncate text-muted-foreground">1 × {line.short}</span>
                        <span className="rp-mono shrink-0 text-foreground">{formatPaise(line.unitPaise)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                    <span className="text-[12px] text-muted-foreground">Total · provisional</span>
                    <span
                      ref={(el) => {
                        refs.provTotal = el;
                      }}
                      className="rp-mono text-[13px] font-medium text-foreground"
                    >
                      ₹0.00
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <PanelHead title="Order summary" />
                <div
                  ref={(el) => {
                    refs.quoteCard = el;
                  }}
                  className="rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-medium text-foreground">Locked quote</span>
                    <span
                      ref={(el) => {
                        refs.quoteStamp = el;
                      }}
                      className="rp-chip"
                      data-state="approved"
                    >
                      authoritative
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-[12px] text-muted-foreground">Total · locked 5 min</span>
                    <span
                      ref={(el) => {
                        refs.quoteTotal = el;
                      }}
                      className="rp-mono text-[13px] font-medium text-foreground"
                    >
                      ₹0.00
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[scenario.merchant, scenario.buyer].map((mandate, k) => (
                    <div
                      key={mandate.id}
                      ref={(el) => {
                        refs.mandateChips[k] = el;
                      }}
                      className="flex flex-col gap-0.5 rounded-lg border border-positive/30 bg-positive/5 px-2.5 py-2"
                    >
                      <span className="rp-mono text-[9.5px] tracking-[0.1em] text-positive uppercase">
                        {mandate.party} mandate
                      </span>
                      <span className="text-[12px] text-foreground">Verified</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-foreground">Checkout</span>
                    <span
                      ref={(el) => {
                        refs.checkoutState = el;
                      }}
                      className="rp-chip"
                    >
                      pending
                    </span>
                  </div>
                  <div
                    ref={(el) => {
                      refs.payCard = el;
                    }}
                    className="mt-2.5 rounded-lg border border-border bg-muted/30 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rp-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                        Payment · test mode
                      </span>
                      <span
                        ref={(el) => {
                          refs.payStatus = el;
                        }}
                        className="rp-chip"
                      >
                        awaiting authorization
                      </span>
                    </div>
                    <div className="rp-track mt-2 h-1">
                      <div
                        ref={(el) => {
                          refs.payBar = el;
                        }}
                        className="rp-fill"
                      />
                    </div>
                    {scenario.payment === "failed" && (
                      <div
                        ref={(el) => {
                          refs.declineNote = el;
                        }}
                        className="mt-1.5 text-[10.5px] leading-[1.4] text-destructive"
                      >
                        Declined. No receipt issued.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* receipt overlay */}
            {evaluation.verdict === "approved" && scenario.payment === "succeeded" && (
              <div className="pointer-events-none absolute inset-x-0 top-[54%] z-10 -translate-y-1/2 px-5">
                <div
                  ref={(el) => {
                    refs.receiptWrap = el;
                  }}
                  className="mx-auto w-full max-w-[320px]"
                >
                  <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-foreground">Receipt</span>
                      <span className="rp-chip" data-state="positive">
                        issued
                      </span>
                    </div>
                    <dl className="mt-3 flex flex-col gap-1 text-[12px]">
                      <ReceiptRow label="Receipt" value={scenario.receipt} />
                      <ReceiptRow label="Items" value={`${lines.length}`} />
                      <ReceiptRow label="Total" value={formatPaise(evaluation.totalPaise)} />
                      <ReceiptRow label="Payment" value="paid · test mode" />
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* gate rail */}
          <aside className="rp-gate flex flex-col gap-3 border-t border-border p-4 sm:p-5 lg:border-t-0 lg:border-l">
            <div className="flex items-center justify-between gap-2">
              <PanelHead title="Policy gate" />
              <span
                ref={(el) => {
                  refs.gateChip = el;
                }}
                className="rp-chip"
              >
                standing by
              </span>
            </div>
            <ol className="flex flex-col gap-1">
              {RULES.map((rule, r) => (
                <li
                  key={rule.id}
                  ref={(el) => {
                    refs.ruleRows[r] = el;
                  }}
                  className="rp-rule"
                >
                  <span className="rp-rule-ico">
                    <span className="rp-ico-dot" />
                    <span className="rp-ico-spin" />
                    <Check className="rp-ico-check size-3.5" strokeWidth={2.5} />
                    <X className="rp-ico-x size-3.5" strokeWidth={2.5} />
                    <span className="rp-ico-dash" />
                  </span>
                  <span className="rp-rule-label">{rule.short}</span>
                  <span
                    ref={(el) => {
                      refs.ruleWords[r] = el;
                    }}
                    className="rp-rule-word sr-only"
                  >
                    ———
                  </span>
                </li>
              ))}
            </ol>
            {evaluation.verdict === "blocked" && (
              <div
                ref={(el) => {
                  refs.reasonBox = el;
                }}
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5"
              >
                <div className="text-[13px] font-medium text-destructive">{failedRule?.label} exceeded</div>
                {failedRule?.id === "per_order_cap" ? (
                  <dl className="mt-3 space-y-2 text-[12px]">
                    <ReceiptRow label="Proposed" value={formatPaise(evaluation.totalPaise)} />
                    <ReceiptRow label="Allowed" value={formatPaise(Math.min(scenario.buyer.perOrderPaise, scenario.merchant.perOrderPaise))} />
                  </dl>
                ) : (
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{evaluation.reasonText}</p>
                )}
                <p className="mt-3 text-[12px] text-muted-foreground">Checkout stopped. No charge.</p>
              </div>
            )}
          </aside>
        </div>

        {/* status bar */}
        <div className="rp-status-bar flex items-center gap-3 border-t border-border px-4 py-2.5">
          <span className="rp-led" data-on={live ? "true" : "false"} />
          <p className="min-w-0 flex-1 text-[12.5px] text-muted-foreground" aria-live="polite">
            {context}
          </p>
          <span
            ref={(el) => {
              refs.ruleNow = el;
            }}
            className="rp-mono hidden shrink-0 text-[10.5px] text-muted-foreground sm:block"
          />
        </div>
        <details key={scenario.id} className="rp-details border-t border-border">
          <summary className="cursor-pointer px-4 py-3 text-[12px] text-muted-foreground">
            Technical details <span className="ml-2">· {events.length} audit events</span>
          </summary>
          <div className="grid gap-6 px-4 pb-5 sm:grid-cols-2">
            <div className="space-y-3 text-[12px] leading-relaxed text-muted-foreground">
              <p>{scenario.blurb}</p>
              <p>Prices are re-fetched before a five-minute quote is issued. Both mandates are checked again at checkout. Rules run in order; the first failure stops evaluation.</p>
              {evaluation.verdict === "blocked" && <p>{evaluation.reasonText} · <code>{evaluation.reasonCode}</code></p>}
              <dl className="space-y-1">
                <ReceiptRow label="Merchant mandate" value={scenario.merchant.id} />
                <ReceiptRow label="Buyer mandate" value={scenario.buyer.id} />
              </dl>
              <p>Demo data and simulated Razorpay payments. No real money moves.</p>
            </div>
            <div className="min-w-0">
              <PanelHead title="Audit log · append-only demo ledger" />
              <ol className="mt-3 space-y-1">
                {events.map((event, i) => (
                  <li key={`${i}-${event.id}`} className="rp-ev" data-tone={eventTone(event.event, !handle.ended && i === events.length - 1)}>
                    <span className="rp-ev-i">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 break-all">{event.event}</span>
                  </li>
                ))}
              </ol>
              <dl className="mt-4 space-y-1 text-[12px]">
                <ReceiptRow label="Quote reference" value={scenario.quote} />
                <ReceiptRow label="Transaction reference" value={scenario.txn} />
              </dl>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
