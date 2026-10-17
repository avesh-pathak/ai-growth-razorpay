"use client";

// components/purchase-flow/PurchaseFlowSection.tsx
// "How a purchase flows" — a visual transaction workbench: the Merchant Agent
// assembles a proposal, policy interlocks vet it, and checkout prints a receipt.

import { PurchaseJourney } from "./journey/PurchaseJourney";

export function PurchaseFlowSection() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-24">
      <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
        <div className="max-w-[42rem]">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            How a purchase flows
          </h2>
          <p className="mt-4 text-[1.125rem] leading-[1.6] text-muted-foreground">
            Agents shop. Your rules decide.
          </p>
        </div>

        <div className="mt-12">
          <PurchaseJourney />
        </div>

        <p className="mt-8 max-w-[46rem] text-[13px] leading-[1.6] text-muted-foreground">
          Interactive demo, not a live checkout. No real money moves.
        </p>
      </div>
    </section>
  );
}
