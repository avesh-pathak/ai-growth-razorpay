import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function Footer() {
  const cols = [
    { title: "Platform", links: [{ label: "Merchant Agent", href: "/agent-activity" }, { label: "Buyer Agent", href: "/agent-activity" }, { label: "Policy Gate", href: "/dashboard" }, { label: "Receipts", href: "/dashboard" }, { label: "Audit Trail", href: "/dashboard" }] },
    { title: "Developers", links: [{ label: "API Reference", href: "#" }, { label: "Machine Surface", href: "#" }, { label: "Protocol Mapping", href: "#" }, { label: "Tamper Tester", href: "#" }, { label: "Docs", href: "#" }] },
    { title: "Product", links: [{ label: "Dashboard", href: "/dashboard" }, { label: "Catalog", href: "/products" }, { label: "Checkout", href: "/checkout" }, { label: "Agent Activity", href: "/agent-activity" }] },
    { title: "Company", links: [{ label: "Pricing", href: "#" }, { label: "Enterprise", href: "#" }, { label: "Community", href: "#" }, { label: "support@settle.dev", href: "mailto:support@settle.dev" }] },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      {/* (glow removed) */}
      <div className="max-w-frame relative mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
        <div className="flex flex-col items-start gap-6 py-20 lg:py-[8.25rem]">
          <h2 className="max-w-[40rem] text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
            Agentic commerce, explainable by design
          </h2>
          <p className="max-w-[40rem] text-[1.125rem] leading-[1.6] text-muted-foreground">
            A store where a Merchant Agent sells and a Buyer Agent buys — every money action gated, bounded, mandated, and receipted. Runs entirely on test-mode rails.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/agent-activity"
              className="inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3 text-[14px] font-medium text-brand-foreground transition-opacity hover:opacity-90"
            >
              Watch the agents run
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-foreground/10">
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              Open the dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-positive" />
            <span>Policy Gate · Mandates · Receipts · Hash-chained audit trail · Tamper-tested</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-border py-12 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title} className="flex flex-col gap-3">
              <h3 className="text-[0.875rem] font-medium text-foreground">{c.title}</h3>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href === "#" ? (
                      <span className="text-sm text-muted-foreground/60">{l.label}</span>
                    ) : (
                      <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border py-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground text-[9px] font-medium">
              S
            </span>
            <span className="text-sm text-muted-foreground">Agentic commerce, explainable by design.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 Settle</span>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
