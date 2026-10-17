"use client";

// components/purchase-flow/PurchaseFlowSection.tsx
// "How a purchase flows" — a live transaction replay: the Merchant Agent
// sells, the Policy Gate authorizes, the Buyer Agent buys. The hero keeps the
// isometric figure; this section is a software demonstration of the flow.

import { ReplayPanel } from "./replay/ReplayPanel";

export function PurchaseFlowSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
        <div className="max-w-[42rem]">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            How a purchase flows
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground">
            A Merchant Agent sells, a Buyer Agent buys, and a Policy Gate decides. Every step is logged and receipted.
          </p>
        </div>

        <div className="mt-12">
          <ReplayPanel />
        </div>

        <p className="mt-8 max-w-[46rem] text-[13px] leading-[1.6] text-muted-foreground">
          The simulation runs on illustrative demo data — a fixed-seed catalog, example mandates and counters, amounts in integer
          paise straight from the seed prices. The production Policy Gate is a server-side module (not built yet), and nothing on
          this page can move money.
        </p>
      </div>
    </section>
  );
}
