// components/purchase-flow/scene/geometry.ts
// Every static path for the agentic-commerce scene, computed once at module
// load. The live layer only moves the groups whose art is built here.

import {
  corners,
  cylinder,
  dotGrid,
  extrude,
  faceTextSvg,
  insetPlan,
  iso,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  pointsAt,
  ring,
  segment,
  sideMatrix,
  slabOf,
  solidSvg,
  topMatrix,
  topTicks,
  type Plan,
  type Plane,
  type Point3,
  type SolidPaths,
} from "@/components/iso/iso-kit";
import { formatPaise } from "@/lib/data/products";
import type { Scenario } from "@/lib/purchase-flow/model";
import * as W from "./view";

const P = W.P;

/* ---------------------------------------------------------------- helpers */

/** A viewer-facing screen: extrude a 45°-rotated ring so the face looks out. */
const boardArt = (board: W.Board, steps = 5, bevel = 1): SolidPaths =>
  extrude(W.boardRing(board, steps), board.z, board.h, P, { convex: true, bevel });

/** The face-local matrix for a board's front face. */
const boardFace = (board: W.Board) => W.boardMatrix(board);

const screws = (plan: Plan, z: number, inset = 22) => corners(plan, inset).map(([x, y]) => iso([x, y, z], P));

const groove = (plan: Plan, z: number, by = 5) => planOutline(insetPlan(plan, by), z, P);

/** Plan-space stations every `gap` units along a polyline, at the given z. */
function viasAlong(points: Point3[], gap: number, inset = 6): Plane[] {
  const out: Plane[] = [];
  let carry = inset;
  for (let index = 1; index < points.length; index++) {
    const [ax, ay] = points[index - 1];
    const [bx, by] = points[index];
    const length = Math.hypot(bx - ax, by - ay);
    let at = carry;
    while (at < length - inset * 0.5) {
      const share = at / length;
      out.push([ax + (bx - ax) * share, ay + (by - ay) * share]);
      at += gap;
    }
    carry = Math.max(0, at - length);
  }
  return out;
}

/** Point along a plan polyline (y-major), with a smooth arc for rides. */
export function alongPath(path: Point3[], t: number, lift = 0): Point3 {
  const clamped = Math.min(1, Math.max(0, t));
  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < path.length; index++) {
    const length = Math.hypot(path[index][0] - path[index - 1][0], path[index][1] - path[index - 1][1]);
    lengths.push(length);
    total += length;
  }
  let want = clamped * total;
  for (let index = 0; index < lengths.length; index++) {
    const span = lengths[index] || 1;
    if (want <= span || index === lengths.length - 1) {
      const share = Math.min(1, want / span);
      const a = path[index];
      const b = path[index + 1];
      return [
        a[0] + (b[0] - a[0]) * share,
        a[1] + (b[1] - a[1]) * share,
        a[2] + (b[2] - a[2]) * share + lift * Math.sin(Math.PI * clamped),
      ];
    }
    want -= span;
  }
  return path[path.length - 1];
}

const smooth = (u: number) => {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
};

/* ------------------------------------------------------------- the surface */

export const MAT_FOOT: SolidPaths = slabOf(insetPlan(W.MAT, 34), -3.5, 3.5, P, 10);
export const MAT_ART: SolidPaths = slabOf(W.MAT, 0, W.MAT_H, P, 12);
export const MAT_GRID = dotGrid(W.MAT.x + 22, W.MAT.y + 18, 38, 9, 28, W.MAT_H + 0.06, P);
export const MAT_SCREWS = screws(W.MAT, W.MAT_H);
export const MAT_TICKS = topTicks(W.MAT.x + 60, W.MAT.x + W.MAT.w - 60, 40, 5, W.MAT.y + W.MAT.d - 14, W.MAT_H, [4, 8], P);

/* ------------------------------------------------------------- platforms */

export const MERCHANT_PAD: SolidPaths = slabOf(W.MERCHANT_PLATFORM, W.ZONE_Z, W.PLATFORM_H, P, 10, 0.8);
export const MERCHANT_GROOVE = groove(W.MERCHANT_PLATFORM, W.ZONE_TOP + 0.01, 6);
export const MERCHANT_SCREWS = screws(W.MERCHANT_PLATFORM, W.ZONE_TOP);

export const GATE_PAD: SolidPaths = slabOf(W.GATE_PLATFORM, W.ZONE_Z, W.PLATFORM_H, P, 10, 0.8);
export const GATE_GROOVE = groove(W.GATE_PLATFORM, W.ZONE_TOP + 0.01, 6);
export const GATE_SCREWS = screws(W.GATE_PLATFORM, W.ZONE_TOP);

export const BUYER_PAD: SolidPaths = slabOf(W.BUYER_PLATFORM, W.ZONE_Z, W.PLATFORM_H, P, 10, 0.8);
export const BUYER_GROOVE = groove(W.BUYER_PLATFORM, W.ZONE_TOP + 0.01, 6);
export const BUYER_SCREWS = screws(W.BUYER_PLATFORM, W.ZONE_TOP);

/** Engraved zone labels, lettered on the plate's top face. */
export const MERCHANT_LABEL_M = topMatrix([W.MERCH_PLATE.x + 9, W.MERCH_PLATE.y + 7], W.ZONE_TOP + 0.74, P, "x");
export const GATE_LABEL_M = topMatrix([W.GATE_PLATE.x + 9, W.GATE_PLATE.y + 7], W.ZONE_TOP + 0.74, P, "x");
export const BUYER_LABEL_M = topMatrix([W.BUYER_PLATE.x + 9, W.BUYER_PLATE.y + 7], W.ZONE_TOP + 0.74, P, "x");

/* ------------------------------------------------------------- merchant set */

export const STORE_PLINTH: SolidPaths = slabOf(W.STORE_PLINTH, W.ZONE_TOP, W.STORE_PLINTH_H, P, 6, 0.6);
export const STORE_NECK: SolidPaths = slabOf(W.STORE_NECK, 34, 16, P, 4);
export const STORE_PANEL_ART: SolidPaths = boardArt(W.STORE_BOARD, 5, 1.1);
export const STORE_CAMERA: SolidPaths = cylinder(W.STORE_CAMERA_AT[0], W.STORE_CAMERA_AT[1], 2.2, W.STORE_CAMERA_Z, 1.5, P, 20);
export const STORE_FACE_M = boardFace(W.STORE_BOARD);

export const CHAT_PANEL_ART: SolidPaths = boardArt(W.CHAT_BOARD, 4, 0.9);
export const CHAT_FACE_M = boardFace(W.CHAT_BOARD);
export const CHAT_ANCHOR = segment(
  [W.CHAT_BOARD.cx, W.CHAT_BOARD.cy, W.CHAT_BOARD.z],
  [W.CHAT_BOARD.cx, W.CHAT_BOARD.cy, W.ZONE_TOP],
  P,
);

export const DESK_PAD: SolidPaths = slabOf(W.DESK_PAD, W.ZONE_TOP, 0.7, P, 6);
export const DESK_GROOVE = planOutline(insetPlan(W.DESK_PAD, 4), W.ZONE_TOP + 0.72, P, 6);

const CARD_BOARD = (x: number): W.Board => ({ cx: x, cy: W.CARD_Y0, w: W.CARD_W, t: W.CARD_T, z: W.ZONE_TOP, h: W.CARD_H, r: 2 });
export const CARD_ARTS: SolidPaths[] = W.CARD_START_X.map((x) => boardArt(CARD_BOARD(x), 4, 0.5));
export const CARD_FACE_YS = W.CARD_START_X.map((x) => ({ x, matrix: boardFace(CARD_BOARD(x)) }));

export const BUNDLE_PANEL_ART: SolidPaths = boardArt(W.BUNDLE_BOARD, 4, 1);
export const BUNDLE_FACE_M = boardFace(W.BUNDLE_BOARD);

export const OFFER_POST_ART: SolidPaths = slabOf(W.OFFER_POST, W.ZONE_TOP, W.OFFER_POST_TOP - W.ZONE_TOP, P, 4);
export const OFFER_PILL_ART: SolidPaths = boardArt(W.OFFER_BOARD, 4, 0.6);
export const OFFER_FACE_M = boardFace(W.OFFER_BOARD);

export const MERCHANT_PLATE_ART: SolidPaths = slabOf(W.MERCH_PLATE, W.ZONE_TOP, 0.7, P, 6);

/* --------------------------------------------------------------- gate set */

export const GATE_PLINTH_ART: SolidPaths = slabOf(W.GATE_PLINTH, W.ZONE_TOP, W.GATE_PLINTH_H, P, 8, 0.6);
export const GATE_PLINTH_GROOVE = groove(W.GATE_PLINTH, W.ZONE_TOP + W.GATE_PLINTH_H + 0.01, 5);
export const GATE_PLINTH_SCREWS = screws(W.GATE_PLINTH, W.ZONE_TOP + W.GATE_PLINTH_H);
export const GATE_POST_ART: SolidPaths = slabOf(W.GATE_POST, W.ZONE_TOP + W.GATE_PLINTH_H, W.GATE_POST_TOP - (W.ZONE_TOP + W.GATE_PLINTH_H), P, 4);
export const GATE_EMITTER: SolidPaths = cylinder(W.GATE_EMITTER_C[0], W.GATE_EMITTER_C[1], 8.5, W.GATE_POST_TOP, 2.5, P, 28);
export const GATE_EMITTER_RING = ring(W.GATE_EMITTER_C[0], W.GATE_EMITTER_C[1], 5.4, W.GATE_POST_TOP + 2.6, P);
export const GATE_EMITTER_DOT = iso([W.GATE_EMITTER_C[0], W.GATE_EMITTER_C[1], W.GATE_POST_TOP + 2.6], P);

export const GATE_PANEL_ART: SolidPaths = boardArt(W.GATE_BOARD, 5, 1.4);
export const GATE_FACE_M = boardFace(W.GATE_BOARD);

export const REASON_PANEL_ART: SolidPaths = boardArt(W.REASON_BOARD, 4, 0.8);
export const REASON_FACE_M = boardFace(W.REASON_BOARD);
export const REASON_ANCHOR = segment(
  [W.REASON_BOARD.cx, W.REASON_BOARD.cy, W.REASON_BOARD.z],
  [W.REASON_BOARD.cx, W.REASON_BOARD.cy, W.ZONE_TOP],
  P,
);

export const SLIP_SLOT_ART: SolidPaths = slabOf(W.SLIP_SLOT, W.ZONE_TOP, 2, P, 4, 0.4);
export const SLIP_SLOT_LINE = lineOnTop([W.SLIP_SLOT.x + 6, W.SLIP_SLOT.y + W.SLIP_SLOT.d / 2], [W.SLIP_SLOT.x + W.SLIP_SLOT.w - 6, W.SLIP_SLOT.y + W.SLIP_SLOT.d / 2], W.ZONE_TOP + 2.08, P);
export const GATE_PLATE_ART: SolidPaths = slabOf(W.GATE_PLATE, W.ZONE_TOP, 0.7, P, 6);

/** Rule tick positions on the authorization face (7 dots, top to bottom). */
export const RULE_DOT_V = Array.from({ length: 7 }, (_, index) => 38 + index * 13.6);

/* -------------------------------------------------------------- buyer set */

export const CATALOG_PANEL_ART: SolidPaths = boardArt(W.CATALOG_BOARD, 4, 0.8);
export const CATALOG_FACE_M = boardFace(W.CATALOG_BOARD);
export const CATALOG_ANCHOR = segment(
  [W.CATALOG_BOARD.cx, W.CATALOG_BOARD.cy, W.CATALOG_BOARD.z],
  [W.CATALOG_BOARD.cx, W.CATALOG_BOARD.cy, W.ZONE_TOP],
  P,
);

export const CHECKOUT_STAND_ART: SolidPaths = slabOf(W.CHECKOUT_STAND, W.ZONE_TOP, W.CHECKOUT_STAND_H, P, 6, 0.6);
export const CHECKOUT_PANEL_ART: SolidPaths = boardArt(W.CHECKOUT_BOARD, 4, 1);
export const CHECKOUT_FACE_M = boardFace(W.CHECKOUT_BOARD);

export const CART_LEGS: SolidPaths[] = corners(W.CART, 3).map(([x, y]) => slabOf({ x: x - 1.3, y: y - 1.3, w: 2.6, d: 2.6, r: 0.8 }, W.ZONE_TOP, 10, P, 3));
export const CART_FLOOR: SolidPaths = slabOf({ x: W.CART.x, y: W.CART.y, w: W.CART.w, d: W.CART.d, r: 3 }, 22, 3, P, 4);
export const CART_WALLS: SolidPaths[] = [
  slabOf({ x: W.CART.x, y: W.CART.y, w: W.CART.w, d: 2.4, r: 0.8 }, 25, 16, P, 3),
  slabOf({ x: W.CART.x, y: W.CART.y + W.CART.d - 2.4, w: W.CART.w, d: 2.4, r: 0.8 }, 25, 16, P, 3),
  slabOf({ x: W.CART.x, y: W.CART.y + 2.4, w: 2.4, d: W.CART.d - 4.8, r: 0.8 }, 25, 16, P, 3),
  slabOf({ x: W.CART.x + W.CART.w - 2.4, y: W.CART.y + 2.4, w: 2.4, d: W.CART.d - 4.8, r: 0.8 }, 25, 16, P, 3),
];
export const CART_HANDLE: SolidPaths[] = [
  slabOf({ x: W.CART.x + W.CART.w - 10, y: W.CART.y + 1, w: 3, d: 3, r: 1 }, W.CART_TOP - 2, 13, P, 3),
  slabOf({ x: W.CART.x + W.CART.w - 21, y: W.CART.y + 1, w: 14, d: 3, r: 1 }, W.CART_TOP + 8, 3, P, 3),
];
export const CART_FACE_M = sideMatrix([W.CART.x, W.CART.y + W.CART.d], W.CART_TOP, P, "left");

export const TOKEN_ARTS: SolidPaths[] = W.CART_SLOTS.map(() => slabOf({ x: 0, y: 0, w: 10, d: 10, r: 1.5 }, 0, 5, P, 3, 0.4));
export const TOKEN_LINE = onTop(
  [
    [-3.4, -3.4],
    [-3.4, 3.4],
  ],
  5.06,
  P,
);

export const BUDGET_STAND_ART: SolidPaths = slabOf(W.BUDGET_STAND, W.ZONE_TOP, W.BUDGET_STAND_H, P, 6, 0.6);
export const BUDGET_PANEL_ART: SolidPaths = boardArt(W.BUDGET_BOARD, 4, 0.8);
export const BUDGET_FACE_M = boardFace(W.BUDGET_BOARD);

export const QUOTE_PANEL_ART: SolidPaths = boardArt(W.QUOTE_BOARD, 4, 0.8);
export const QUOTE_FACE_M = boardFace(W.QUOTE_BOARD);
export const QUOTE_ANCHOR = segment(
  [W.QUOTE_BOARD.cx, W.QUOTE_BOARD.cy, W.QUOTE_BOARD.z],
  [W.QUOTE_BOARD.cx, W.QUOTE_BOARD.cy, W.ZONE_TOP],
  P,
);

const PAY_BOARD: W.Board = { cx: 0, cy: 0, w: W.PAY_CARD_W, t: W.PAY_CARD_D, z: 0, h: W.PAY_CARD_H, r: 2 };
export const PAY_CARD_ART: SolidPaths = boardArt(PAY_BOARD, 4, 0.6);
export const PAY_FACE_M = boardFace(PAY_BOARD);

export const BUYER_PLATE_ART: SolidPaths = slabOf(W.BUYER_PLATE, W.ZONE_TOP, 0.7, P, 6);

/* ------------------------------------------------------------- data paths */

export const DOC_LEGS_D = pathOf(pointsAt(W.DOC_PATH, P));
export const BUYER_LEGS_D = pathOf(pointsAt(W.CHIP_PATH, P));
export const REJECT_LEG_D = pathOf(pointsAt(W.REJECT_PATH, P));

export const ROUTE_VIAS: Plane[] = [
  ...viasAlong(W.DOC_PATH, 26, 10),
  ...viasAlong(W.CHIP_PATH, 26, 10),
];
export const ROUTE_VIAS_FLAT = ROUTE_VIAS.map(([x, y]) => iso([x, y, W.ROUTE_Z], P));

export const MERCHANT_PORT_RING = ring(W.MERCHANT_PORT[0], W.MERCHANT_PORT[1], 5.5, W.ROUTE_Z + 0.04, P);
export const GATE_IN_RING = ring(W.GATE_IN[0], W.GATE_IN[1], 5.5, W.ROUTE_Z + 0.04, P);
export const GATE_OUT_RING = ring(W.GATE_OUT[0], W.GATE_OUT[1], 5.5, W.ROUTE_Z + 0.04, P);
export const BUYER_PORT_RING = ring(W.BUYER_PORT[0], W.BUYER_PORT[1], 5.5, W.ROUTE_Z + 0.04, P);
export const REPLAY_PAD_RING = ring(W.REJECT_PAD[0], W.REJECT_PAD[1], 6.5, W.ROUTE_Z + 0.04, P);
export const REJECT_PAD_DOT = iso([W.REJECT_PAD[0], W.REJECT_PAD[1], W.ROUTE_Z + 0.06], P);
export const PORT_DOTS = [W.MERCHANT_PORT, W.GATE_IN, W.GATE_OUT, W.BUYER_PORT].map(([x, y]) => iso([x, y, W.ROUTE_Z + 0.06], P));

/* ---------------------------------------------------------------- packets */

export const DOC_PACKET: SolidPaths = slabOf({ x: 0, y: 0, w: 16, d: 11, r: 1.5 }, 0, 3.5, P, 4, 0.4);
export const DOC_PACKET_LINES = onTop(
  [
    [3, -3],
    [13, -3],
  ],
  3.56,
  P,
);
export const DOC_PACKET_RULES = [
  onTop([[3, 2.5], [10, 2.5]], 3.56, P),
  onTop([[3, -3], [13, -3]], 3.56, P),
];
export const CHIP_PACKET: SolidPaths = cylinder(0, 0, 6.4, 0, 3.4, P, 24, 0.5);
export const CHIP_PACKET_RING = ring(0, 0, 4.2, 3.46, P, 24);
export const CHIP_PACKET_DOT = iso([0, 0, 3.46], P);

/* --------------------------------------------------- dynamic paper (slips) */

const SLIP_CHECK = `<path class="sc-check" d="M9 26 L13 30 L21 20" fill="none"/>`;

/** The gate's decision slip, rebuilt as it rises from the slot. */
export function slipArt(u: number, scenario: Scenario): string {
  const grow = smooth(u);
  const height = 3 + grow * 44;
  const board: W.Board = { ...W.SLIP_BOARD, h: height };
  const slab = extrude(W.boardRing(board), board.z, height, P, { convex: true, bevel: 0.4 });
  const face = W.boardMatrix(board);
  const rows = [
    u > 0.26 ? faceTextSvg("translate(7 10)", "decision", { size: 3, tone: "lo" }) : "",
    u > 0.42 ? `<g class="sc-ok">${faceTextSvg("translate(7 20)", "approved", { size: 4.4, tone: "mid" })}</g>` : "",
    u > 0.58 ? SLIP_CHECK : "",
    u > 0.72 ? faceTextSvg("translate(7 40)", scenario.txn, { size: 2.8, tone: "lo" }) : "",
    u > 0.84 ? faceTextSvg("translate(7 47)", "7 / 7 rules", { size: 2.8, tone: "lo" }) : "",
  ].join("");
  return solidSvg(slab, { className: "sc-paper", crease: "faint" }) + `<g transform="${face}">${rows}</g>`;
}

/** The buyer's receipt, unfolded above the checkout. */
export function receiptArt(u: number, scenario: Scenario, totalPaise: number): string {
  const grow = smooth(u);
  const height = 3 + grow * 52;
  const board: W.Board = { ...W.RECEIPT_BOARD, h: height };
  const slab = extrude(W.boardRing(board), board.z, height, P, { convex: true, bevel: 0.4 });
  const face = W.boardMatrix(board);
  const rows = [
    u > 0.2 ? faceTextSvg("translate(7 10)", "receipt", { size: 3, tone: "lo" }) : "",
    u > 0.36 ? faceTextSvg("translate(7 19)", scenario.receipt, { size: 3.6, tone: "hi" }) : "",
    u > 0.52 ? faceTextSvg("translate(7 30)", formatPaise(totalPaise), { size: 4.4, tone: "hi" }) : "",
    u > 0.66 ? `<g class="sc-ok">${faceTextSvg("translate(7 40)", "paid · test mode", { size: 3, tone: "mid" })}</g>` : "",
    u > 0.8 ? faceTextSvg("translate(7 52)", `${scenario.txn} · ${scenario.quote}`, { size: 2.7, tone: "lo" }) : "",
  ].join("");
  return solidSvg(slab, { className: "sc-paper", crease: "faint" }) + `<g transform="${face}">${rows}</g>`;
}
