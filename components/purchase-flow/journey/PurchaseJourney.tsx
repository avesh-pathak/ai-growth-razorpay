"use client";

import * as React from "react";
import { Check, ShieldCheck, ShoppingBag, Store, X } from "lucide-react";
import { formatPaise } from "@/lib/data/products";
import { evaluate, scenariosFor, type Scenario } from "@/lib/purchase-flow/model";
import { makeStory, stagesFor, stateLabel } from "@/lib/purchase-flow/story";
import { useStory } from "@/lib/purchase-flow/useStory";
import { ScenarioPicker } from "../ui";
import { contextLine, stageKind } from "../replay/frame";
import { emptyJourneyRefs, JourneyArt, type JourneyRefs } from "./art";
import { journeyAt, type JourneyPose } from "./model";
import "./journey.css";

function paint(refs: JourneyRefs, pose: JourneyPose, mobile: boolean) {
  const { frame } = pose;
  pose.bubbles.forEach((bubble, index) => {
    const group = refs.bubbles[index];
    const text = refs.bubbleText[index];
    if (group) group.dataset.tone = bubble.tone;
    if (text && text.textContent !== bubble.text) text.textContent = bubble.text;
  });
  refs.handoffs.forEach((arrow, index) => { if (arrow) arrow.dataset.state = pose.handoffs[index]; });
  refs.buyerLeader?.setAttribute("d", pose.receipt > 0 ? "M930 38V60m-4-6 4 6 4-6" : "M1027 38C1052 53 1045 95 1045 173m-4-6 4 6 4-6");
  if (refs.handoffText) refs.handoffText.textContent = pose.handoffs[1] === "blocked" ? "Stopped here" : pose.handoffs[1] === "waiting" ? "After approval" : "Checkout";
  refs.screen.forEach((line, index) => {
    line?.setAttribute("transform", `translate(111 0) scale(${(0.05 + pose.screen[index]! * 0.95).toFixed(3)} 1) translate(-111 0)`);
  });
  if (refs.svg) {
    refs.svg.setAttribute("viewBox", mobile ? `${pose.cameraX.toFixed(2)} -12 400 370` : "0 -12 1140 400");
    refs.svg.dataset.gate = frame.gateVerdict;
    refs.svg.dataset.pay = frame.payState;
  }
  if (refs.ticket) {
    refs.ticket.setAttribute("transform", `translate(${pose.ticketX.toFixed(2)} 233)`);
    refs.ticket.style.opacity = pose.ticketVisible.toFixed(3);
  }
  pose.products.forEach((product, i) => {
    const node = refs.products[i];
    if (!node) return;
    const x = 103 + i * 35 + (190 - (103 + i * 35)) * product.pack;
    const y = 220 + 20 * product.pack;
    node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(0.78 - product.pack * 0.2).toFixed(3)})`);
    node.style.opacity = product.visible.toFixed(3);
  });
  refs.lamps.forEach((lamp, i) => { if (lamp) lamp.dataset.state = frame.checks[i]; });
  refs.barrier?.setAttribute("transform", `translate(655 226) rotate(${(90 * pose.gateOpen).toFixed(2)})`);
  if (refs.scanner) {
    refs.scanner.style.opacity = frame.gateActive ? "1" : "0";
    refs.scanner.setAttribute("transform", `translate(0 ${(pose.scan * 80).toFixed(2)})`);
  }
  if (refs.receipt) {
    refs.receipt.setAttribute("transform", `translate(0 ${((1 - pose.receipt) * 140).toFixed(2)})`);
    refs.receipt.style.opacity = pose.receipt > 0 ? "1" : "0";
  }
  if (refs.card) {
    refs.card.setAttribute("transform", `translate(${(1100 - 44 * pose.card).toFixed(2)} 225)`);
    refs.card.style.opacity = frame.payVis > 0 && frame.payState !== "succeeded" ? "1" : "0";
  }
  refs.belt?.setAttribute("transform", `translate(${pose.belt.toFixed(2)} 0)`);
}

function JourneyRun({ scenario }: { scenario: Scenario }) {
  const evaluation = React.useMemo(() => evaluate(scenario), [scenario]);
  const story = React.useMemo(() => makeStory(stagesFor(scenario, evaluation)), [scenario, evaluation]);
  const refs = React.useMemo(() => emptyJourneyRefs(), []);
  const mobile = React.useRef(false);
  const clockRef = React.useRef(0);
  const id = React.useId().replace(/:/g, "");
  const draw = React.useCallback((clock: number) => {
    clockRef.current = clock;
    paint(refs, journeyAt(scenario, evaluation, story, clock), mobile.current);
  }, [refs, scenario, evaluation, story]);
  const handle = useStory(story, draw, undefined, 0);

  React.useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const sync = () => { mobile.current = query.matches; draw(clockRef.current); };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [draw]);

  React.useEffect(() => {
    if (handle.reduced) handle.toggle();
    // The hook settles the complete, deterministic result without motion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle.reduced]);

  React.useEffect(() => {
    if (!handle.ended || !handle.visible || handle.reduced) return;
    const timer = window.setTimeout(handle.replay, 3200);
    return () => window.clearTimeout(timer);
  }, [handle.ended, handle.visible, handle.reduced, handle.replay]);

  const phase = Math.min(handle.phase, story.stages.length - 1);
  const stage = story.stages[phase]!;
  const active = stageKind(stage.id);
  const blocked = stage.id === "rejected";
  const declined = stage.id === "result" && scenario.payment === "failed";
  const complete = stage.id === "result" && !declined;
  const tone = blocked || declined ? "bad" : complete ? "good" : "active";
  const status = stateLabel(story, phase, scenario, evaluation, handle.ended);
  const caption = blocked
    ? `Order limit exceeded: ${formatPaise(evaluation.totalPaise)} proposed, ${formatPaise(Math.min(scenario.buyer.perOrderPaise, scenario.merchant.perOrderPaise))} allowed. No charge.`
    : stage.id === "propose"
      ? `${evaluation.lines.length} essentials. One ${formatPaise(evaluation.totalPaise)} proposal.`
      : contextLine(scenario, evaluation, story, phase);
  const events = story.stages.slice(0, phase + 1);

  return <div ref={handle.anchor} className="pj-workbench" data-tone={tone}>
    <div className="pj-scene-top">
      <span className="pj-status"><span className="pj-status-dot" />{status}</span>
      <span className="pj-test-note">Simulated · no real money</span>
    </div>
    <JourneyArt refs={refs} evaluation={evaluation} id={id} />
    <ol className="pj-stations" aria-label="Purchase journey">
      {([
        ["merchant", "Merchant agent", "Builds the offer", Store],
        ["gate", "Policy gate", "Checks your limits", ShieldCheck],
        ["buyer", "Buyer agent", "Pays & gets a receipt", ShoppingBag],
      ] as const).map(([key, title, description, Icon]) => <li key={key} aria-current={key === active ? "step" : undefined}>
        <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
        <div><span className="pj-station-title">{title}</span><span className="pj-station-description">{description}</span></div>
      </li>)}
    </ol>
    <div className="pj-caption-bar">
      <div className="pj-caption" aria-live="polite" aria-atomic="true">
        {blocked || declined ? <X size={18} aria-hidden="true" /> : complete ? <Check size={18} aria-hidden="true" /> : <span className="pj-caption-dot" />}
        <p>{caption}</p>
      </div>
    </div>
    <details className="pj-details">
      <summary>Behind the scenes <span>· {events.length} events</span></summary>
      <div className="pj-detail-body">
        <div><p>{scenario.blurb}</p><p>Prices are re-fetched before quoting. Both mandates are checked at checkout. The first failed rule stops evaluation.</p>
          <p>Merchant {scenario.merchant.id} · Buyer {scenario.buyer.id}</p>
          {blocked && <p>{evaluation.reasonText} · <code>{evaluation.reasonCode}</code></p>}
        </div>
        <ol>{events.map((event, i) => <li key={event.id}><span>{String(i + 1).padStart(2, "0")}</span><code>{event.event}</code></li>)}</ol>
      </div>
    </details>
  </div>;
}

export function PurchaseJourney() {
  const scenarios = React.useMemo(() => scenariosFor("buyer"), []);
  const [scenarioId, setScenarioId] = React.useState(scenarios[0]!.id);
  const scenario = scenarios.find((entry) => entry.id === scenarioId) ?? scenarios[0]!;
  return <div className="purchase-journey" role="region" aria-label="Animated purchase journey">
    <div className="pj-scenario-picker"><ScenarioPicker scenarios={scenarios} value={scenarioId} onChange={setScenarioId} label="Purchase scenario" /></div>
    <JourneyRun key={scenario.id} scenario={scenario} />
  </div>;
}
