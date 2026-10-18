import Link from "next/link";

export function Footer() {
  const cols = [
    { title: "Platform", links: [{ label: "Merchant Agent", href: "/agent-activity" }, { label: "Buyer Agent", href: "/agent-activity" }, { label: "Policy Gate", href: "/dashboard" }, { label: "Receipts", href: "/dashboard" }, { label: "Audit Trail", href: "/dashboard" }] },
    { title: "Developers", links: [{ label: "API Reference", href: "#" }, { label: "Machine Surface", href: "#" }, { label: "Protocol Mapping", href: "#" }, { label: "Tamper Tester", href: "#" }, { label: "Docs", href: "#" }] },
    { title: "Product", links: [{ label: "Dashboard", href: "/dashboard" }, { label: "Catalog", href: "/products" }, { label: "Checkout", href: "/checkout" }, { label: "Agent Activity", href: "/agent-activity" }] },
    { title: "Company", links: [{ label: "Pricing", href: "#" }, { label: "Enterprise", href: "#" }, { label: "Community", href: "#" }, { label: "support@slashcheckout.dev", href: "mailto:support@slashcheckout.dev" }] },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      {/* (glow removed) */}
      <div className="max-w-frame relative mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32">
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {cols.map((c) => (
            <div key={c.title} className="flex min-w-0 flex-col gap-3">
              <h3 className="text-[0.875rem] font-medium text-foreground">{c.title}</h3>
              <ul className="flex flex-col gap-2">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href === "#" ? (
                      <span className="text-sm text-muted-foreground/60">{l.label}</span>
                    ) : (
                      <Link href={l.href} className="break-words text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-6 pb-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-foreground text-[9px] font-medium">
              S
            </span>
            <span className="text-sm text-muted-foreground">AI makes the sale. You set the limits.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>© 2026 SlashCheckout</span>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
