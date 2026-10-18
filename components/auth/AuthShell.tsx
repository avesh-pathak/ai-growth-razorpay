// components/auth/AuthShell.tsx — shared frame for the sign-in / register screens.
// Composition follows design.md: white paper floor with one warm trust-band rail;
// the gate chain renders as a vertical ledger on desktop and as a compact strip on
// mobile; mono micro-labels carry the meta voice; CTAs are brand pills.

import { Fragment } from "react";
import { FileCheck2, ReceiptText, ScrollText, ShieldCheck } from "lucide-react";

const STATIONS = [
  {
    key: "mandate",
    hue: "var(--brand-tertiary)",
    icon: ScrollText,
    label: "Mandate",
    short: "Mandate",
    desc: "Signed, scoped, time-bounded. The buyer may narrow it — never widen it.",
  },
  {
    key: "quote",
    hue: "var(--brand-secondary)",
    icon: FileCheck2,
    label: "Quote",
    short: "Quote",
    desc: "Prices re-fetched from the live catalog and locked for five minutes.",
  },
  {
    key: "gate",
    hue: "var(--brand)",
    icon: ShieldCheck,
    label: "Policy Gate",
    short: "Gate",
    desc: "Seven deterministic rules, precedence order. First failure wins.",
  },
  {
    key: "receipt",
    hue: "var(--brand-quaternary)",
    icon: ReceiptText,
    label: "Receipt",
    short: "Receipt",
    desc: "Canonical signed JSON. Hash-chained, append-only, tamper-tested.",
  },
] as const;

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col lg:h-[calc(100dvh-4.5rem)] lg:min-h-0 lg:flex-none lg:flex-row lg:overflow-hidden">
      {/* Trust-band rail — desktop only */}
      <aside className="trust-band relative hidden flex-col justify-between overflow-hidden border-r border-border p-10 lg:flex lg:min-h-0 lg:w-[44%] xl:w-[47%] xl:p-14">
        <div className="my-auto">
          <h1 className="rule-in max-w-[20ch] text-[clamp(2rem,2.6vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-foreground">
            Let AI make the sale. <span className="text-foreground/50">You set the limits.</span>
          </h1>

          {/* The gate chain as a vertical ledger */}
          <ol role="list" className="mt-9 space-y-5">
            {STATIONS.map((station, i) => (
              <li
                key={station.key}
                className="rule-in relative flex gap-4"
                style={{ animationDelay: `${80 + i * 70}ms` }}
              >
                {i < STATIONS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-3.5 top-9 -bottom-5 w-px bg-foreground/15"
                  />
                )}
                <span
                  aria-hidden
                  className="relative z-[1] flex size-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: station.hue, boxShadow: "0 0 0 3px var(--band)" }}
                >
                  <station.icon className="size-3.5 text-white" strokeWidth={2.25} />
                </span>
                <span className="pt-0.5">
                  <span className="block text-[13.5px] font-medium text-foreground">{station.label}</span>
                  <span className="mt-0.5 block max-w-[40ch] text-[12.5px] leading-[1.55] text-muted-foreground">
                    {station.desc}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p
          className="rule-in flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ animationDelay: "360ms" }}
        >
          <span aria-hidden className="size-1.5 shrink-0 animate-pulse rounded-full bg-brand" />
          Razorpay test-mode rails · no real money moves
        </p>
      </aside>

      {/* Form column */}
      <div className="flex flex-1 flex-col items-center px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:py-4">
        <div className="my-auto w-full max-w-[26rem]">
          {/* Tagline — mobile only (the trust-band rail is hidden) */}
          <div className="lg:hidden">
            <h1 className="rule-in text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.03em] text-foreground">
              Let AI make the sale. <span className="text-foreground/50">You set the limits.</span>
            </h1>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8 lg:mt-0">
            <h2 className="text-[1.375rem] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
            <p className="mt-1.5 text-[14px] leading-[1.55] text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </div>

          <div className="mt-5 text-center text-[13.5px] text-muted-foreground">{footer}</div>

          {/* Compact gate chain — mobile */}
          <div aria-hidden className="mt-8 flex items-center justify-center gap-2 lg:hidden">
            {STATIONS.map((station, i) => (
              <Fragment key={station.key}>
                {i > 0 && <span className="h-px w-3 shrink-0 bg-border" />}
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: station.hue }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {station.short}
                  </span>
                </span>
              </Fragment>
            ))}
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground lg:hidden">
            <span aria-hidden className="size-1.5 shrink-0 animate-pulse rounded-full bg-brand" />
            Test-mode demo · no real money moves
          </p>
        </div>
      </div>
    </div>
  );
}
