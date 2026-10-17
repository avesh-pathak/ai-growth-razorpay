// components/purchase-flow/scene/view.ts
// World layout for the agentic-commerce scene: one shared digital surface with
// three environments — a merchant storefront (left), a policy-authorization hub
// (centre) and an autonomous buyer desk (right) — joined by a routed data path
// running in front. x runs left to right, y toward the viewer, z up, in units
// of about 1 px.

import {
  cameraOf,
  fitProjection,
  iso,
  roundedPlan,
  translateAlong,
  type Plan,
  type Plane,
  type Point3,
  type Projection,
} from "@/components/iso/iso-kit";

export const WIDTH = 1160;
export const HEIGHT = 700;
export const AZIMUTH = 45;
const PAD = 10;

/* surface --------------------------------------------------------------------- */

export const MAT: Plan = { x: -560, y: -150, w: 1120, d: 300, r: 44 };
export const MAT_H = 5;

export const PLATFORM_H = 7;
export const ZONE_Z = MAT_H;
export const ZONE_TOP = MAT_H + PLATFORM_H; // 12

export const MERCHANT_PLATFORM: Plan = { x: -525, y: -115, w: 305, d: 175, r: 10 };
export const GATE_PLATFORM: Plan = { x: -120, y: -125, w: 240, d: 200, r: 10 };
export const BUYER_PLATFORM: Plan = { x: 220, y: -115, w: 305, d: 175, r: 10 };

/* route ------------------------------------------------------------------------- */

export const ROUTE_Y = 100;

const MERCHANT_FRONT = MERCHANT_PLATFORM.y + MERCHANT_PLATFORM.d; // 60
const GATE_FRONT = GATE_PLATFORM.y + GATE_PLATFORM.d; // 75
const BUYER_FRONT = BUYER_PLATFORM.y + BUYER_PLATFORM.d; // 60

export const MERCHANT_PORT: [number, number] = [-380, MERCHANT_FRONT];
export const GATE_IN: [number, number] = [-52, GATE_FRONT];
export const GATE_OUT: [number, number] = [52, GATE_FRONT];
export const BUYER_PORT: [number, number] = [380, BUYER_FRONT];
export const REJECT_PAD: [number, number] = [152, 130];

export const ROUTE_Z = MAT_H + 0.2;

/** proposal document: merchant -> gate. */
export const DOC_PATH: Point3[] = [
  [MERCHANT_PORT[0], MERCHANT_PORT[1], ROUTE_Z],
  [MERCHANT_PORT[0], ROUTE_Y, ROUTE_Z],
  [GATE_IN[0], ROUTE_Y, ROUTE_Z],
  [GATE_IN[0], GATE_IN[1], ROUTE_Z],
];

/** quote document: buyer -> gate (the buyer lane, travelled backwards). */
export const QUOTE_PATH: Point3[] = [
  [BUYER_PORT[0], BUYER_PORT[1], ROUTE_Z],
  [BUYER_PORT[0], ROUTE_Y, ROUTE_Z],
  [GATE_OUT[0], ROUTE_Y, ROUTE_Z],
  [GATE_OUT[0], GATE_OUT[1], ROUTE_Z],
];

/** decision chip: gate -> buyer. */
export const CHIP_PATH: Point3[] = [
  [GATE_OUT[0], GATE_OUT[1], ROUTE_Z],
  [GATE_OUT[0], ROUTE_Y, ROUTE_Z],
  [BUYER_PORT[0], ROUTE_Y, ROUTE_Z],
  [BUYER_PORT[0], BUYER_PORT[1], ROUTE_Z],
];

/** rejected chip: gate -> the rejected pad. */
export const REJECT_PATH: Point3[] = [
  [GATE_OUT[0], GATE_OUT[1], ROUTE_Z],
  [GATE_OUT[0], ROUTE_Y, ROUTE_Z],
  [REJECT_PAD[0], ROUTE_Y, ROUTE_Z],
  [REJECT_PAD[0], REJECT_PAD[1], ROUTE_Z],
];

/* boards -------------------------------------------------------------------------
   Screens and standing placards are rotated 45° in plan so their faces look at
   the viewer — at azimuth 45 a board aligned with the view axis projects as an
   upright, unsheared rectangle, like a monitor turned to face the desk. Its
   flanks project edge-on and vanish, so a board reads as a screen plus a thin
   top bevel. Face-local coordinates stay (u ∈ [0, w] right, v ∈ [0, h] down). */

const DIAG = Math.SQRT1_2;

export interface Board {
  /** plan centre */
  cx: number;
  cy: number;
  /** width across the face */
  w: number;
  /** thickness */
  t: number;
  /** base and face height */
  z: number;
  h: number;
  /** corner radius */
  r?: number;
}

/** Plan ring of a viewer-facing board, wound like the kit's rectangles. */
export function boardRing({ cx, cy, w, t, r = 3 }: Board, steps = 6): Plane[] {
  return roundedPlan({ x: -w / 2, y: -t / 2, w, d: t, r }, steps).map(
    ([lx, ly]) => [cx + (lx + ly) * DIAG, cy + (ly - lx) * DIAG] as Plane,
  );
}

const thousandth = (value: number) => Math.round(value * 1000) / 1000;

/** Face-local matrix for a board's front face, taken at its top-left corner. */
export function boardMatrix(board: Board): string {
  const { k, cosE } = cameraOf(P);
  const { cx, cy, w, t, z, h } = board;
  const [ox, oy] = iso([cx + ((t - w) / 2) * DIAG, cy + ((w + t) / 2) * DIAG, z + h], P);
  return `matrix(${thousandth(k)} 0 0 ${thousandth(cosE * k)} ${thousandth(ox)} ${thousandth(oy)})`;
}

/** The board's plan footprint — a diamond square — as plan-space corners. */
export function boardCorners({ cx, cy, w, t }: Board): Plane[] {
  const s = ((w + t) / 2) * DIAG;
  return [
    [cx - s, cy - s],
    [cx + s, cy - s],
    [cx + s, cy + s],
    [cx - s, cy + s],
  ];
}

/** The four top-face corners, for the projection fit. */
export function boardTop(board: Board): Point3[] {
  return boardCorners(board).map(([x, y]) => [x, y, board.z + board.h] as Point3);
}

/* merchant — a storefront on a desk ------------------------------------------------ */

export const STORE_PLINTH: Plan = { x: -505, y: -105, w: 104, d: 56, r: 4 };
export const STORE_PLINTH_H = 22;
export const STORE_NECK: Plan = { x: -463, y: -88, w: 20, d: 20, r: 3 };
export const STORE_NECK_TOP = 34;
export const STORE_BOARD: Board = { cx: -452, cy: -64, w: 120, t: 7, z: 50, h: 96, r: 3 };
export const STORE_CAMERA_AT: Plane = [-424, -87];
export const STORE_CAMERA_Z = STORE_BOARD.z + STORE_BOARD.h;

export const CHAT_BOARD: Board = { cx: -496, cy: -16, w: 62, t: 3, z: 30, h: 40, r: 3 };

/** product placards: three cards that converge into the bundle cluster. */
export const CARD_W = 30;
export const CARD_T = 3;
export const CARD_H = 30;
export const CARD_START_X = [-474, -430, -386];
export const CARD_JOIN_X = [-448, -416, -384];
export const CARD_Y0 = -16;
export const CARD_Y1 = -6;
export const CARD_LIFT = 5;

export const BUNDLE_BOARD: Board = { cx: -348, cy: -36, w: 104, t: 3, z: 40, h: 64, r: 3 };

export const OFFER_POST: Plan = { x: -241, y: -14, w: 7, d: 7, r: 2 };
export const OFFER_POST_TOP = 46;
export const OFFER_BOARD: Board = { cx: -237, cy: -10, w: 40, t: 3, z: 46, h: 20, r: 3 };

export const DESK_PAD: Plan = { x: -488, y: -36, w: 142, d: 42, r: 6 };
export const MERCH_PLATE: Plan = { x: -470, y: 38, w: 108, d: 10, r: 2 };

/* gate — a floating layered authorization panel ------------------------------------- */

export const GATE_PLINTH: Plan = { x: -70, y: -95, w: 140, d: 110, r: 6 };
export const GATE_PLINTH_H = 8;
export const GATE_POST: Plan = { x: -10, y: -44, w: 20, d: 20, r: 3 };
export const GATE_POST_TOP = 50;
export const GATE_EMITTER_C = [0, -34] as const;
export const GATE_BOARD: Board = { cx: 0, cy: -47, w: 160, t: 6, z: 62, h: 158, r: 4 };

export const REASON_BOARD: Board = { cx: 90, cy: 8, w: 88, t: 4, z: 30, h: 62, r: 3 };

export const SLIP_SLOT: Plan = { x: -105, y: 44, w: 60, d: 5, r: 1.5 };
export const SLIP_BOARD: Board = { cx: -75, cy: 46, w: 56, t: 2, z: 14, h: 47, r: 1 };
export const SLIP_Z = SLIP_BOARD.z;
export const GATE_PLATE: Plan = { x: -54, y: 54, w: 108, d: 10, r: 2 };

/* buyer — an autonomous purchasing desk ---------------------------------------------- */

export const CATALOG_BOARD: Board = { cx: 288, cy: -88, w: 96, t: 4, z: 64, h: 84, r: 3 };

export const CHECKOUT_STAND: Plan = { x: 400, y: -80, w: 68, d: 48, r: 3 };
export const CHECKOUT_STAND_H = 18;
export const CHECKOUT_BOARD: Board = { cx: 434, cy: -76, w: 92, t: 4, z: 30, h: 86, r: 3 };

export const CART: Plan = { x: 296, y: -42, w: 56, d: 40, r: 3 };
export const CART_TOP = 41;
export const CART_SLOTS: Array<[number, number]> = [
  [306, -32],
  [322, -32],
  [338, -32],
  [306, -18],
  [322, -18],
  [338, -18],
];
export const CART_SLOT_Z = 25;

export const BUDGET_STAND: Plan = { x: 232, y: 6, w: 68, d: 20, r: 3 };
export const BUDGET_STAND_H = 18;
export const BUDGET_BOARD: Board = { cx: 266, cy: 16, w: 88, t: 4, z: 30, h: 64, r: 3 };

export const QUOTE_BOARD: Board = { cx: 372, cy: 24, w: 84, t: 3, z: 40, h: 72, r: 3 };

export const PAY_CARD_W = 27;
export const PAY_CARD_D = 3;
export const PAY_CARD_H = 16;
/** card travel: from beside the quote to the checkout's card slot. */
export const PAY_FROM: Point3 = [346, 12, 58];
export const PAY_TO: Point3 = [432, -72, 50];

export const RECEIPT_BOARD: Board = { cx: 431, cy: -63, w: 66, t: 2, z: 116, h: 54, r: 1 };
export const RECEIPT_Z = RECEIPT_BOARD.z;
export const BUYER_PLATE: Plan = { x: 296, y: 38, w: 108, d: 10, r: 2 };

/* projection -------------------------------------------------------------------------- */

const FIT_POINTS: Point3[] = [
  [MAT.x, MAT.y, 0],
  [MAT.x + MAT.w, MAT.y, 0],
  [MAT.x + MAT.w, MAT.y + MAT.d, 0],
  [MAT.x, MAT.y + MAT.d, 0],
  ...boardTop(STORE_BOARD),
  ...boardTop(GATE_BOARD),
  [RECEIPT_BOARD.cx, RECEIPT_BOARD.cy, RECEIPT_BOARD.z + 54],
];

export const P: Projection = fitProjection(FIT_POINTS, WIDTH, HEIGHT, { pad: PAD, azimuth: AZIMUTH });

export const at = (point: Point3) => iso(point, P);
export const move = (dx: number, dy: number, dz: number) => translateAlong(P, [dx, dy, dz]);
