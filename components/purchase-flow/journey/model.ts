import type { Evaluation, Scenario } from "@/lib/purchase-flow/model";
import { within, type Story } from "@/lib/purchase-flow/story";
import { frameAt, stageKind } from "../replay/frame";

type BubbleTone = "waiting" | "merchant" | "gate" | "buyer" | "good" | "bad";

// One model drives the drawing, the camera and the readout. The travelling
// ticket represents an order proposal, not a physical shipment.
export function journeyAt(scenario: Scenario, evaluation: Evaluation, story: Story, clock: number) {
  const frame = frameAt(scenario, evaluation, story, clock);
  const w = (id: string, from = 0, to = 1) => {
    const index = story.stages.findIndex((stage) => stage.id === id);
    return index < 0 ? 0 : within(story, clock, index, from, to);
  };
  const toGate = w("submit", 0.05, 0.95);
  const toBuyer = w("decision", 0.2, 0.95);
  const active = stageKind(frame.stageId);
  const blocked = frame.gateVerdict === "blocked";
  const buyerLabels: Record<string, string> = {
    catalog: "Finding the items",
    cart: "Building the cart",
    quote: "Price locked · 5 min",
    checkout: "Confirming permission",
    payment: frame.payState === "declined" ? "Payment declined" : frame.payState === "succeeded" ? "Payment complete" : "Processing payment",
    result: scenario.payment === "succeeded" ? "Receipt issued" : "Payment declined",
  };
  const bubbles: { text: string; tone: BubbleTone }[] = [
    {
      text: frame.stageId === "request" ? "Request received" : frame.stageId === "propose" ? "Building your bundle" : frame.stageId === "submit" ? "Sent for review" : "Bundle proposed",
      tone: active === "merchant" ? "merchant" : "waiting",
    },
    {
      text: blocked ? "Order limit exceeded" : frame.gateVerdict === "approved" ? "Approved to buy" : frame.gateActive ? "Checking your limits" : "Awaiting proposal",
      tone: blocked ? "bad" : frame.gateVerdict === "approved" ? "good" : frame.gateActive ? "gate" : "waiting",
    },
    {
      text: blocked ? "Checkout not started" : buyerLabels[frame.stageId] ?? "Waiting for approval",
      tone: blocked || active !== "buyer" ? "waiting" : frame.payState === "declined" ? "bad" : frame.payState === "succeeded" ? "good" : "buyer",
    },
  ];
  return {
    frame,
    bubbles,
    handoffs: [toGate === 0 ? "waiting" : toGate < 1 ? "active" : "done", blocked ? "blocked" : toBuyer > 0 || frame.gateVerdict === "approved" ? "active" : "waiting"],
    screen: [0, 1, 2, 3].map((index) => w("request", index * 0.1, 0.35 + index * 0.1)),
    ticketX: 190 + 370 * toGate + 370 * toBuyer,
    ticketVisible: w("propose", 0.5, 0.85) * (1 - w("payment", 0.05, 0.5)),
    products: frame.cards.map((visible, index) => ({
      visible: visible * (1 - w("submit", 0, 0.35)),
      pack: w("propose", 0.48 + index * 0.025, 0.72 + index * 0.025),
    })),
    gateOpen: toBuyer,
    scan: frame.gateActive ? (frame.reveal % 1) : 0,
    card: w("payment", 0.05, 0.55),
    receipt: frame.receiptVis,
    // The phone camera follows the same ticket rather than shrinking the
    // entire desktop drawing into illegible miniature artwork.
    cameraX: 370 * toGate + 370 * toBuyer,
    belt: (clock * 12) % 24,
  };
}

export type JourneyPose = ReturnType<typeof journeyAt>;
