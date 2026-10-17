// app/agent-activity/page.tsx
import { Brain, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

const RUNS = [
  {
    id: "run_001",
    goal: "Buy a pour-over setup under ₹3,000",
    budget: 300000,
    status: "completed",
    steps: [
      { t: "thought", text: "Goal: pour-over setup under ₹3,000. Need brewer + filters + maybe grinder." },
      { t: "tool", text: "fetch_catalog({category:'Brewers'}) → 6 items" },
      { t: "tool", text: "fetch_catalog({category:'Accessories'}) → 8 items" },
      { t: "decision", text: "Pick V60 Dripper 02 (₹1,899) + 100 filters (₹499) = ₹2,398. Under budget." },
      { t: "tool", text: "request_quote({items:[v60, filters]}) → ₹2,398, stock ok" },
      { t: "tool", text: "check_mandate({max_per_order:300000}) → allowed" },
      { t: "tool", text: "checkout({quote_ref}) → order ord_8f2a1c, payment captured" },
      { t: "decision", text: "Purchase complete. Receipt R-441 issued. Audit trail updated." },
    ],
  },
  {
    id: "run_002",
    goal: "Buy an espresso starter kit under ₹5,000",
    budget: 500000,
    status: "completed-with-block",
    steps: [
      { t: "thought", text: "Goal: espresso starter kit under ₹5,000. Need machine-adjacent gear (tamper, pitcher, distribution tool)." },
      { t: "tool", text: "fetch_catalog({category:'Accessories'}) → 8 items" },
      { t: "decision", text: "Pick tamper 58mm (₹1,999) + milk pitcher (₹1,299) + WDT (₹1,499) = ₹4,797." },
      { t: "tool", text: "request_quote → ₹4,797, stock ok" },
      { t: "tool", text: "check_mandate → allowed" },
      { t: "tool", text: "checkout → order ord_9b3c2d" },
      { t: "decision", text: "Purchase complete. Receipt R-442 issued." },
    ],
  },
  {
    id: "run_003",
    goal: "Buy a premium grinder under ₹10,000",
    budget: 1000000,
    status: "blocked",
    steps: [
      { t: "thought", text: "Goal: premium grinder under ₹10,000." },
      { t: "tool", text: "fetch_catalog({category:'Grinders'}) → 4 items" },
      { t: "decision", text: "Hand Grinder C40 (₹12,999) exceeds budget. Electric Grinder E1 (₹18,999) exceeds budget." },
      { t: "tool", text: "check_mandate({max_per_order:1000000}) → blocked: budget_exceeded (line 1299900 > 1000000? no — per-order cap)" },
      { t: "decision", text: "No qualifying grinder within budget. Dropping line. Logging block. Partial cart abandoned." },
    ],
  },
];

export default function AgentActivityPage() {
  return (
    <div className="max-w-frame mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32 py-[8.25rem]">
      <div className="flex flex-col gap-4 max-w-[39rem]">
        <p className="font-dm-mono text-[12px] leading-4 tracking-[0.02em] uppercase text-muted-foreground">Buyer agent</p>
        <h1 className="font-heading text-[clamp(2.5rem,1.5rem+2.5vw,3.75rem)] font-medium leading-[1.2] tracking-[-0.02em] text-primary">
          Agent activity
        </h1>
        <p className="font-sans text-[1.125rem] leading-[1.5] font-normal text-muted-foreground">
          Autonomous runs with zero human clicks. Every thought, tool call, and decision logged and receipted.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-6">
        {RUNS.map((run) => (
          <div key={run.id} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                  <Brain className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-[1.125rem] font-medium tracking-[-0.02em] text-primary">{run.goal}</h2>
                  <p className="font-dm-mono text-[11px] tracking-[0.02em] text-muted-foreground">
                    {run.id} · budget ₹{(run.budget / 100).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-sm px-2 py-0.5 font-dm-mono text-[10px] tracking-[0.02em] uppercase ${
                  run.status === "completed"
                    ? "bg-positive/10 text-positive"
                    : run.status === "completed-with-block"
                    ? "bg-brand/10 text-brand"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {run.status}
              </span>
            </div>

            <ol className="mt-5 flex flex-col gap-2.5">
              {run.steps.map((s, i) => {
                const Icon = s.t === "thought" ? Clock : s.t === "tool" ? CheckCircle2 : s.t === "decision" ? AlertTriangle : XCircle;
                const color = s.t === "thought" ? "text-muted-foreground" : s.t === "tool" ? "text-positive" : s.t === "decision" ? "text-primary" : "text-destructive";
                return (
                  <li key={i} className="flex items-start gap-3">
                    <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
                    <span className={`font-mono text-[12px] leading-[1.6] ${color}`}>{s.text}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
