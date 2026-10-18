// app/dashboard/layout.tsx — Merchant area shell: shared sub-navigation for every /dashboard page.

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/refunds", label: "Refunds" },
  { href: "/dashboard/analytics", label: "Analytics" },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <div className="border-b border-border/60 bg-background/60">
        <nav
          aria-label="Merchant sections"
          className="max-w-frame mx-auto flex w-full gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-32"
        >
          {NAV.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative whitespace-nowrap px-3 py-3 text-sm transition-colors hover:text-foreground",
                  active ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" />}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </>
  );
}
