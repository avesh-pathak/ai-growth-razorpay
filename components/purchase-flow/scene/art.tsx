"use client";

// components/purchase-flow/scene/art.tsx
// The scene's static React tree, ordered back to front. The live layer moves
// the groups collected in SceneRefs; nothing here animates on its own.

import * as React from "react";
import { Dots, FaceText, Line, Solid } from "@/components/iso/react/draw";
import { formatPaise } from "@/lib/data/products";
import type { Evaluation, Scenario } from "@/lib/purchase-flow/model";
import * as G from "./geometry";
import * as W from "./view";

export interface SceneRefs {
  chat: SVGGElement | null;
  cards: Array<SVGGElement | null>;
  bundle: SVGGElement | null;
  price: SVGGElement | null;
  offerText: SVGTextElement | null;
  offerDot: SVGCircleElement | null;
  doc: SVGGElement | null;
  chip: SVGGElement | null;
  flowOut: SVGPathElement | null;
  flowBack: SVGPathElement | null;
  dots: Array<SVGCircleElement | null>;
  mandateDots: Array<SVGCircleElement | null>;
  shieldFill: SVGPathElement | null;
  shieldCheck: SVGPathElement | null;
  reason: SVGGElement | null;
  slip: SVGGElement | null;
  tiles: Array<SVGGElement | null>;
  tokens: Array<SVGGElement | null>;
  cartCount: SVGTextElement | null;
  quote: SVGGElement | null;
  budget: SVGGElement | null;
  budgetFill: SVGRectElement | null;
  card: SVGGElement | null;
  payText: SVGTextElement | null;
  storeText: SVGTextElement | null;
  gateText: SVGTextElement | null;
  receipt: SVGGElement | null;
  cursorM: SVGGElement | null;
  cursorB: SVGGElement | null;
}

export function emptyRefs(): SceneRefs {
  return {
    chat: null,
    cards: [null, null, null],
    bundle: null,
    price: null,
    offerText: null,
    offerDot: null,
    doc: null,
    chip: null,
    flowOut: null,
    flowBack: null,
    dots: Array.from({ length: 7 }, () => null),
    mandateDots: [null, null],
    shieldFill: null,
    shieldCheck: null,
    reason: null,
    slip: null,
    tiles: Array.from({ length: 6 }, () => null),
    tokens: Array.from({ length: 6 }, () => null),
    cartCount: null,
    quote: null,
    budget: null,
    budgetFill: null,
    card: null,
    payText: null,
    storeText: null,
    gateText: null,
    receipt: null,
    cursorM: null,
    cursorB: null,
  };
}

const CURSOR_D = "M0 0 L0 7.4 L2.1 5.7 L3.5 8.6 L5 7.9 L3.6 5.1 L6.1 4.9 Z";

function wrap(text: string, max: number, lines = 3): string[] {
  const words = text.split(" ");
  const out: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > max && line) {
      out.push(line);
      line = word;
      if (out.length === lines) return out;
    } else {
      line = (line + " " + word).trim();
    }
  }
  if (line) out.push(line);
  return out.slice(0, lines);
}

/** Small pictograms for the six SKUs, drawn in face-local units. */
function Glyph({ sku, accent = false }: { sku: string; accent?: boolean }) {
  const cls = accent ? "sc-glyph sc-glyph-accent" : "sc-glyph";
  switch (sku) {
    case "p1": // V60 dripper
      return (
        <g className={cls}>
          <path d="M-6.4 4.6 L6.4 4.6 L2 -5.4 L-2 -5.4 Z" />
          <path d="M-7.6 6.4 L7.6 6.4" />
          <path d="M-4.6 0 L4.6 0" />
        </g>
      );
    case "p7": // C40 grinder
      return (
        <g className={cls}>
          <rect x={-4.6} y={-4.4} width={9.2} height={10.4} rx={2.6} />
          <path d="M2 -6.2 A2.4 2.4 0 0 1 -2 -6.2" />
          <path d="M2.4 -6.6 L7 -3.4" />
        </g>
      );
    case "p11": // Stagg kettle
      return (
        <g className={cls}>
          <rect x={-5.6} y={-3.4} width={10.4} height={8.6} rx={2.4} />
          <path d="M4.8 -1.4 L9.6 -5.6" />
          <path d="M-5.2 -4.6 A2.4 2.4 0 0 1 -0.6 -4.6" />
        </g>
      );
    case "p15": // scale
      return (
        <g className={cls}>
          <rect x={-6.6} y={-1.6} width={13.2} height={5.6} rx={1.8} />
          <rect x={-2.8} y={-5.8} width={5.6} height={2.6} rx={0.9} />
        </g>
      );
    case "p14": // filters
      return (
        <g className={cls}>
          <path d="M-6.6 5 L6.6 5 L1.6 -5.4 L-1.6 -5.4 Z" />
          <path d="M-4.6 1.4 L4.6 1.4" />
          <path d="M-5.2 5 L5.2 5" />
        </g>
      );
    default: // p21 beans
      return (
        <g className={cls}>
          <rect x={-4.6} y={-5.2} width={9.2} height={11} rx={2.2} />
          <path d="M-4.4 -2.6 L4.4 -2.6" />
          <ellipse cx={0.4} cy={1.8} rx={2} ry={1.5} />
        </g>
      );
  }
}

export function CommerceArt({ scenario, evaluation, refs }: { scenario: Scenario; evaluation: Evaluation; refs: SceneRefs }) {
  const lines = evaluation.lines;
  const capPaise = Math.min(scenario.merchant.perOrderPaise, scenario.buyer.perOrderPaise);
  const over = evaluation.totalPaise > capPaise;
  const failed = evaluation.failedIndex >= 0 ? evaluation.rules[evaluation.failedIndex] : null;
  const reasonLines = wrap(failed?.reason ?? "all seven rules passed", 38, 2);

  return (
    <svg className="iso-svg sc-scene" viewBox={`0 0 ${W.WIDTH} ${W.HEIGHT}`} role="img" aria-label="A merchant agent, a policy gate and a buyer agent on one shared surface, with a transaction travelling between them">
      {/* surface ---------------------------------------------------------- */}
      <Solid paths={G.MAT_FOOT} crease="none" tone="lo" />
      <Solid paths={G.MAT_ART} halo />
      <Dots points={G.MAT_GRID} tone="faint" size={0.5} />
      <Line d={G.MAT_TICKS.minor} tone="faint" />
      <Line d={G.MAT_TICKS.major} tone="lo" />
      <Dots points={G.MAT_SCREWS} tone="lo" size={0.9} />

      {/* data lanes on the surface ----------------------------------------- */}
      <Line d={G.DOC_LEGS_D} tone="faint" />
      <Line d={G.BUYER_LEGS_D} tone="faint" />
      <Line d={G.REJECT_LEG_D} tone="faint" />
      <Dots points={G.ROUTE_VIAS_FLAT} tone="faint" size={0.7} />
      <path ref={(el) => { refs.flowOut = el; }} className="iso-line sc-flow sc-ink-m" data-tone="lo" d={G.DOC_LEGS_D} />
      <path ref={(el) => { refs.flowBack = el; }} className="iso-line sc-flow sc-ink-b" data-tone="lo" d={G.BUYER_LEGS_D} />
      <Line d={G.MERCHANT_PORT_RING} className="sc-ink-m" tone="lo" />
      <Line d={G.GATE_IN_RING} className="sc-ink-g" tone="lo" />
      <Line d={G.GATE_OUT_RING} className="sc-ink-g" tone="lo" />
      <Line d={G.BUYER_PORT_RING} className="sc-ink-b" tone="lo" />
      <Line d={G.REPLAY_PAD_RING} className="sc-ink-red" tone="lo" />
      <Dots points={[...G.PORT_DOTS, G.REJECT_PAD_DOT]} tone="mid" size={1} />

      {/* ------------------------------------------------------ merchant zone */}
      <Solid paths={G.MERCHANT_PAD} halo />
      <Line d={G.MERCHANT_GROOVE} tone="faint" />
      <Dots points={G.MERCHANT_SCREWS} tone="lo" size={0.8} />

      <Solid paths={G.STORE_PLINTH} />
      <Solid paths={G.STORE_NECK} />
      <Solid paths={G.STORE_PANEL_ART} lit />
      <Solid paths={G.STORE_CAMERA} tone="mid" />
      <g transform={G.STORE_FACE_M} className="sc-screen-scope sc-accent-m">
        <rect className="sc-glass" x={2} y={2} width={116} height={92} rx={3} />
        <FaceText transform="translate(9 14)" size={4.4} tone="hi">SLASHCHECKOUT STORE</FaceText>
        <FaceText transform="translate(112 13)" size={2.9} tone="lo" anchor="end">6 products · live</FaceText>
        <path className="sc-rule" d="M7 18 H113" />
        {[0, 1, 2].map((index) => {
          const line = lines[index];
          if (!line) return null;
          const u = 8 + index * 38;
          return (
            <g key={line.sku}>
              <rect className="sc-tile-store" x={u} y={23} width={32} height={36} rx={3} />
              <g transform={`translate(${u + 16} ${35})`}>
                <Glyph sku={line.sku} accent />
              </g>
              <FaceText transform={`translate(${u + 16} 51)`} size={3} tone="mid" anchor="middle">{line.short}</FaceText>
              <FaceText transform={`translate(${u + 16} 56.4)`} size={2.5} tone="hi" anchor="middle">{formatPaise(line.unitPaise)}</FaceText>
            </g>
          );
        })}
        <path className="sc-rule" d="M7 84 H113" />
        <circle className="sc-store-dot" cx={11} cy={89.6} r={1.8} />
        <FaceText transform="translate(17 91)" size={3.2} tone="mid"><tspan ref={(el) => { refs.storeText = el; }}>listening…</tspan></FaceText>
        <g ref={(el) => { refs.cursorM = el; }} className="sc-cursor">
          <path d={CURSOR_D} />
        </g>
      </g>

      <Line d={G.CHAT_ANCHOR} tone="faint" dotted />
      <g ref={(el) => { refs.chat = el; }} className="sc-float">
        <Solid paths={G.CHAT_PANEL_ART} lit />
        <g transform={G.CHAT_FACE_M} className="sc-screen-scope">
          <rect className="sc-glass" x={2} y={2} width={64} height={36} rx={3} />
          <FaceText transform="translate(7 12)" size={3} tone="lo">shopper</FaceText>
          <FaceText transform="translate(7 25)" size={4.2} tone="hi">help me build a</FaceText>
          <FaceText transform="translate(7 33)" size={4.2} tone="hi">pour-over setup</FaceText>
        </g>
      </g>

      <Solid paths={G.DESK_PAD} />
      <Line d={G.DESK_GROOVE} tone="faint" />

      <g ref={(el) => { refs.bundle = el; }} className="sc-float">
        <Solid paths={G.BUNDLE_PANEL_ART} lit className="sc-paper" />
        <g transform={G.BUNDLE_FACE_M}>
          <FaceText transform="translate(8 12)" size={3.1} tone="lo">recommended bundle</FaceText>
          <FaceText transform="translate(8 20)" size={3.1} tone="mid">{`${lines.length} items · vendor list`}</FaceText>
          {lines.slice(0, 3).map((line, index) => (
            <g key={line.sku}>
              <FaceText transform={`translate(10 ${31 + index * 8})`} size={3} tone="hi">{line.short}</FaceText>
              <FaceText transform={`translate(108 ${31 + index * 8})`} size={3} tone="mid" anchor="end">{formatPaise(line.unitPaise)}</FaceText>
            </g>
          ))}
          <FaceText transform="translate(10 55)" size={2.9} tone="lo">{`+ ${lines.length - 3} more lines`}</FaceText>
          <g ref={(el) => { refs.price = el; }}>
            <path className="sc-rule" d="M8 57.5 H110" />
            <FaceText transform="translate(10 62.4)" size={3} tone="lo">total</FaceText>
            <FaceText transform="translate(108 62.6)" size={4} tone="hi" anchor="end">{formatPaise(evaluation.totalPaise)}</FaceText>
          </g>
        </g>
      </g>

      {[0, 1, 2].map((index) => {
        const line = lines[index];
        if (!line) return null;
        return (
          <g key={line.sku} ref={(el) => { refs.cards[index] = el; }} className="sc-card">
            <Solid paths={G.CARD_ARTS[index]!} lit />
            <g className="sc-accent-m" transform={G.CARD_FACE_YS[index]!.matrix}>
              <g transform="translate(15 13)">
                <Glyph sku={line.sku} accent />
              </g>
              <FaceText transform="translate(15 22.6)" size={2.8} tone="mid" anchor="middle">{line.short}</FaceText>
              <FaceText transform="translate(15 27.4)" size={2.5} tone="lo" anchor="middle">{formatPaise(line.unitPaise)}</FaceText>
            </g>
          </g>
        );
      })}

      <Solid paths={G.OFFER_POST_ART} />
      <Solid paths={G.OFFER_PILL_ART} lit />
      <g transform={G.OFFER_FACE_M}>
        <FaceText transform="translate(6 9.4)" size={3} tone="lo">offer</FaceText>
        <FaceText transform="translate(6 17.6)" size={3.8} tone="mid">
          <tspan ref={(el) => { refs.offerText = el; }}>pending</tspan>
        </FaceText>
        <circle ref={(el) => { refs.offerDot = el; }} className="sc-offer-dot" cx={34} cy={15} r={2.1} />
      </g>

      <Solid paths={G.MERCHANT_PLATE_ART} />
      <g className="sc-label-m">
        <FaceText transform={G.MERCHANT_LABEL_M} size={5.2} tone="lo">MERCHANT · STOREFRONT</FaceText>
      </g>

      {/* ---------------------------------------------------------- gate zone */}
      <Solid paths={G.GATE_PAD} halo />
      <Line d={G.GATE_GROOVE} tone="faint" />
      <Dots points={G.GATE_SCREWS} tone="lo" size={0.8} />

      <Solid paths={G.GATE_PLINTH_ART} />
      <Line d={G.GATE_PLINTH_GROOVE} tone="faint" />
      <Dots points={G.GATE_PLINTH_SCREWS} tone="lo" size={0.7} />
      <Solid paths={G.GATE_POST_ART} />
      <Solid paths={G.GATE_EMITTER} tone="mid" />
      <Line d={G.GATE_EMITTER_RING} className="sc-ink-g" tone="lo" />
      <circle className="sc-emitter-dot" cx={G.GATE_EMITTER_DOT[0]} cy={G.GATE_EMITTER_DOT[1]} r={1.6} />

      <Solid paths={G.GATE_PANEL_ART} lit />
      <g transform={G.GATE_FACE_M} className="sc-screen-scope">
        <rect className="sc-glass" x={2} y={2} width={156} height={154} rx={4} />
        <FaceText transform="translate(12 17)" size={5} tone="hi">AUTHORIZE</FaceText>
        <FaceText transform="translate(12 25.6)" size={2.9} tone="lo">7 rules · first failure wins</FaceText>
        <FaceText transform="translate(150 25.6)" size={2.8} tone="faint" anchor="end">{scenario.txn}</FaceText>
        <path className="sc-rule" d="M10 30 H150" />
        <path className="sc-shield" d="M46 36 L74 46 L74 70 C74 87 62 96 46 102 C30 96 18 87 18 70 L18 46 Z" />
        <path
          ref={(el) => { refs.shieldFill = el; }}
          className="sc-shield-fill"
          d="M46 36 L74 46 L74 70 C74 87 62 96 46 102 C30 96 18 87 18 70 L18 46 Z"
        />
        <path className="sc-shield-inner" d="M46 42 L68 50 L68 70 C68 83 59 90 46 95 C33 90 24 83 24 70 L24 50 Z" />
        <path ref={(el) => { refs.shieldCheck = el; }} className="sc-shield-check" d="M33 68 L43 78 L60 57" />
        <path className="sc-rule" d="M107 32 V122" />
        {G.RULE_DOT_V.map((v, index) => (
          <circle
            key={index}
            ref={(el) => { refs.dots[index] = el; }}
            className="sc-rule-dot"
            cx={118}
            cy={v}
            r={3.7}
          />
        ))}
        <rect className="sc-chipbg" x={12} y={128} width={62} height={12} rx={3} />
        <FaceText transform="translate(18 136.6)" size={3.3} tone="mid">{scenario.merchant.id}</FaceText>
        <circle ref={(el) => { refs.mandateDots[0] = el; }} className="sc-mandate-dot" cx={82} cy={134} r={2.5} />
        <rect className="sc-chipbg" x={12} y={144} width={62} height={12} rx={3} />
        <FaceText transform="translate(18 152.6)" size={3.3} tone="mid">{scenario.buyer.id}</FaceText>
        <circle ref={(el) => { refs.mandateDots[1] = el; }} className="sc-mandate-dot" cx={82} cy={150} r={2.5} />
        <FaceText transform="translate(96 133)" size={2.9} tone="lo">decision</FaceText>
        <FaceText transform="translate(96 144.6)" size={4.4} tone="mid">
          <tspan ref={(el) => { refs.gateText = el; }}>pending</tspan>
        </FaceText>
      </g>

      <Line d={G.REASON_ANCHOR} tone="faint" dotted />
      <g ref={(el) => { refs.reason = el; }} className="sc-reason">
        <Solid paths={G.REASON_PANEL_ART} lit />
        <g transform={G.REASON_FACE_M} className="sc-screen-scope">
          <rect className="sc-glass" x={2} y={2} width={84} height={58} rx={3} />
          <FaceText transform="translate(7 11)" size={2.9} tone="lo">reason</FaceText>
          <g className="sc-bad">
            <FaceText transform="translate(7 25)" size={4.2} tone="mid">{evaluation.reasonCode ?? "none"}</FaceText>
          </g>
          <FaceText transform="translate(7 34.4)" size={3.1} tone="mid">{failed?.short ?? "all clear"}</FaceText>
          {reasonLines.map((line, index) => (
            <FaceText key={index} transform={`translate(7 ${45 + index * 5.6})`} size={2.8} tone="lo">{line}</FaceText>
          ))}
        </g>
      </g>

      <Solid paths={G.SLIP_SLOT_ART} />
      <Line d={G.SLIP_SLOT_LINE} tone="mid" />
      <g ref={(el) => { refs.slip = el; }} className="sc-slip" />

      <Solid paths={G.GATE_PLATE_ART} />
      <g className="sc-label-g">
        <FaceText transform={G.GATE_LABEL_M} size={5.2} tone="lo">POLICY · AUTHORIZE</FaceText>
      </g>

      {/* --------------------------------------------------------- buyer zone */}
      <Solid paths={G.BUYER_PAD} halo />
      <Line d={G.BUYER_GROOVE} tone="faint" />
      <Dots points={G.BUYER_SCREWS} tone="lo" size={0.8} />

      <Line d={G.CATALOG_ANCHOR} tone="faint" dotted />
      <Solid paths={G.CATALOG_PANEL_ART} lit />
      <g transform={G.CATALOG_FACE_M} className="sc-screen-scope sc-accent-b">
        <rect className="sc-glass" x={2} y={2} width={92} height={80} rx={3} />
        <FaceText transform="translate(8 14)" size={4.2} tone="hi">catalog</FaceText>
        <FaceText transform="translate(88 13.6)" size={2.9} tone="lo" anchor="end">6 skus</FaceText>
        <path className="sc-rule" d="M7 19 H89" />
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const line = lines[index];
          if (!line) return null;
          const u = 8 + (index % 3) * 29;
          const v = 24 + Math.floor(index / 3) * 26;
          return (
            <g key={line.sku} ref={(el) => { refs.tiles[index] = el; }}>
              <rect className="sc-tile-cat" x={u} y={v} width={26} height={24} rx={3} />
              <g transform={`translate(${u + 13} ${v + 12})`}>
                <Glyph sku={line.sku} accent />
              </g>
            </g>
          );
        })}
        <FaceText transform="translate(8 79)" size={2.8} tone="lo">live · re-fetched</FaceText>
        <g ref={(el) => { refs.cursorB = el; }} className="sc-cursor">
          <path d={CURSOR_D} />
        </g>
      </g>

      <Solid paths={G.CHECKOUT_STAND_ART} />
      <Solid paths={G.CHECKOUT_PANEL_ART} lit />
      <g transform={G.CHECKOUT_FACE_M} className="sc-screen-scope">
        <rect className="sc-glass" x={2} y={2} width={88} height={82} rx={3} />
        <FaceText transform="translate(8 14)" size={4.2} tone="hi">checkout</FaceText>
        <path className="sc-rule" d="M7 19 H85" />
        <FaceText transform="translate(8 27)" size={2.9} tone="lo">{`order · ${lines.length} items`}</FaceText>
        <FaceText transform="translate(8 35)" size={3.8} tone="hi">{formatPaise(evaluation.totalPaise)}</FaceText>
        <FaceText transform="translate(8 48)" size={3.4} tone="mid">
          <tspan ref={(el) => { refs.payText = el; }}>awaiting quote</tspan>
        </FaceText>
        <rect className="sc-slot" x={12} y={60} width={68} height={6} rx={2} />
        <path className="sc-rule" d="M16 63 H76" />
        <rect className="sc-pill" x={12} y={72} width={58} height={10} rx={3} />
        <FaceText transform="translate(16.5 79)" size={2.8} tone="lo">auto · no human click</FaceText>
      </g>

      <Solid paths={G.BUDGET_STAND_ART} />
      <Solid paths={G.BUDGET_PANEL_ART} lit />
      <g ref={(el) => { refs.budget = el; }}>
        <g transform={G.BUDGET_FACE_M} className="sc-screen-scope">
          <rect className="sc-glass" x={2} y={2} width={84} height={60} rx={3} />
          <FaceText transform="translate(8 12)" size={2.9} tone="lo">buyer mandate</FaceText>
          <FaceText transform="translate(80 12)" size={2.9} tone="mid" anchor="end">{scenario.buyer.id}</FaceText>
          <FaceText transform="translate(8 22)" size={3.1} tone="mid">per-order cap</FaceText>
          <FaceText transform="translate(80 22)" size={3.4} tone="hi" anchor="end">{formatPaise(capPaise)}</FaceText>
          <rect className="sc-bar-track" x={8} y={27} width={72} height={6} rx={2} />
          <rect ref={(el) => { refs.budgetFill = el; }} className="sc-bar-fill" x={8} y={27} width={0} height={6} rx={2} />
          <path className="sc-bar-cap" d="M80 25 V35" />
          <FaceText transform="translate(8 44)" size={2.8} tone="lo">{`spent today ${formatPaise(scenario.buyer.spentTodayPaise)}`}</FaceText>
          <FaceText transform="translate(8 52.6)" size={3} tone="hi">{`quote ${formatPaise(evaluation.totalPaise)}`}</FaceText>
          <g className={over ? "sc-bad" : "sc-ok"}>
            <FaceText transform="translate(80 52.6)" size={2.8} tone="mid" anchor="end">{over ? "over cap" : "within cap"}</FaceText>
          </g>
        </g>
      </g>

      {G.CART_LEGS.map((paths, index) => (
        <Solid key={`leg${index}`} paths={paths} />
      ))}
      <Solid paths={G.CART_WALLS[0]!} />
      <Solid paths={G.CART_WALLS[2]!} />
      <Solid paths={G.CART_FLOOR} />
      {G.TOKEN_ARTS.map((paths, index) => (
        <g key={`token${index}`} ref={(el) => { refs.tokens[index] = el; }} className="sc-token">
          <Solid paths={paths} lit />
          <Line d={G.TOKEN_LINE} tone="faint" />
        </g>
      ))}
      <Solid paths={G.CART_WALLS[3]!} />
      <Solid paths={G.CART_WALLS[1]!} />
      <Solid paths={G.CART_HANDLE[0]!} />
      <Solid paths={G.CART_HANDLE[1]!} />
      <g transform={G.CART_FACE_M}>
        <FaceText transform="translate(6 8.6)" size={2.8} tone="lo">cart</FaceText>
        <FaceText transform="translate(30 12)" size={4.4} tone="hi" anchor="middle">
          <tspan ref={(el) => { refs.cartCount = el; }}>×0</tspan>
        </FaceText>
      </g>

      <Line d={G.QUOTE_ANCHOR} tone="faint" dotted />
      <g ref={(el) => { refs.quote = el; }} className="sc-float">
        <Solid paths={G.QUOTE_PANEL_ART} lit className="sc-paper" />
        <g transform={G.QUOTE_FACE_M}>
          <FaceText transform="translate(8 11.4)" size={3.1} tone="lo">quote</FaceText>
          <FaceText transform="translate(76 11.4)" size={3.2} tone="mid" anchor="end">{scenario.quote}</FaceText>
          <FaceText transform="translate(8 26)" size={5.2} tone="hi">{formatPaise(evaluation.totalPaise)}</FaceText>
          <path className="sc-rule" d="M8 31 H76" />
          <FaceText transform="translate(8 39)" size={2.9} tone="mid">{`${lines.length} items · vendor list price`}</FaceText>
          <g className="sc-ok">
            <FaceText transform="translate(8 47)" size={2.9} tone="mid">requote matches quote</FaceText>
          </g>
          <FaceText transform="translate(8 55)" size={2.8} tone="lo">valid 5 min · demo</FaceText>
          <rect className="sc-stamp" x={52} y={60} width={24} height={10} rx={2} />
          <FaceText transform="translate(64 66.8)" size={2.6} tone="lo" anchor="middle">demo</FaceText>
        </g>
      </g>

      <g ref={(el) => { refs.card = el; }} className="sc-card-pay">
        <Solid paths={G.PAY_CARD_ART} lit />
        <g transform={G.PAY_FACE_M}>
          <rect className="sc-mag" x={0} y={3} width={W.PAY_CARD_W} height={3.6} />
          <rect className="sc-chip-sm" x={4} y={10} width={5} height={3.8} rx={0.8} />
        </g>
      </g>

      <g ref={(el) => { refs.receipt = el; }} className="sc-receipt" />

      {/* -------------------------------------------------------------- riders */}
      <g ref={(el) => { refs.doc = el; }} className="sc-doc">
        <Solid paths={G.DOC_PACKET} />
        <Line d={G.DOC_PACKET_RULES[0]!} tone="faint" />
        <Line d={G.DOC_PACKET_RULES[1]!} tone="faint" />
      </g>
      <g ref={(el) => { refs.chip = el; }} className="sc-chip-packet">
        <Solid paths={G.CHIP_PACKET} />
        <Line d={G.CHIP_PACKET_RING} tone="faint" />
        <circle className="sc-chip-pin" cx={G.CHIP_PACKET_DOT[0]} cy={G.CHIP_PACKET_DOT[1]} r={1.1} />
      </g>

      <Solid paths={G.BUYER_PLATE_ART} />
      <g className="sc-label-b">
        <FaceText transform={G.BUYER_LABEL_M} size={5.2} tone="lo">BUYER · AUTONOMOUS CHECKOUT</FaceText>
      </g>
    </svg>
  );
}
