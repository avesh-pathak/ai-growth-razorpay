"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Menu,
  ShoppingCart,
  Sun,
  Moon,
  PlayCircle,
  LayoutDashboard,
  Bot,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";

const PRODUCT_CATS = ["Brewers", "Grinders", "Kettles", "Accessories", "Beans"];

/* Solid, theme-aware icon button — 44px touch target, never transparent */
const ICON_BTN =
  "size-11 rounded-full border-border bg-card dark:bg-card hover:bg-muted dark:hover:bg-muted";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const Icon = theme === "light" ? Moon : Sun;
  return (
    <Button
      variant="outline"
      size="icon-lg"
      onClick={() => setTheme(next)}
      className={ICON_BTN}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function NavRow({
  href,
  icon: Icon,
  title,
  desc,
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:bg-muted"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-background">
        <Icon className="size-4" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[14px] font-medium leading-none text-foreground">
          {title}
        </span>
        <span className="truncate text-[12px] leading-none text-muted-foreground">
          {desc}
        </span>
      </span>
      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Header() {
  const cart = useCart();
  const { theme, setTheme } = useTheme();
  const [mobile, setMobile] = useState(false);
  const closeMobile = () => setMobile(false);
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 sm:px-6">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-brand focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:text-brand-foreground"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-14 max-w-frame items-center justify-between gap-6 rounded-full border border-border bg-card px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-foreground">
          <Image src="/slashcheckout-mark.png" alt="" width={28} height={28} className="size-7 shrink-0" priority />
          <span className="text-[15px] font-medium tracking-[-0.02em]">SlashCheckout</span>
        </Link>

        {/* Desktop nav — shadcn NavigationMenu */}
        <NavigationMenu className="hidden lg:flex" aria-label="Primary">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-[14px] text-muted-foreground hover:text-foreground">
                Products
              </NavigationMenuTrigger>
              <NavigationMenuContent className="w-[13rem]">
                <ul className="flex flex-col gap-0.5 p-1">
                  {PRODUCT_CATS.map((cat) => (
                    <li key={cat}>
                      <NavigationMenuLink
                        className="text-muted-foreground hover:text-foreground"
                        render={
                          <Link
                            href={`/products?category=${encodeURIComponent(cat)}`}
                          />
                        }
                      >
                        {cat}
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
                <Separator className="my-1" />
                <div className="p-1">
                  <NavigationMenuLink
                    className="font-medium text-brand"
                    render={<Link href="/products" />}
                  >
                    View all products
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} text-[14px] text-muted-foreground hover:text-foreground`}
                render={<Link href="/#how-it-works" />}
              >
                How it works
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} text-[14px] text-muted-foreground hover:text-foreground`}
                render={<Link href="/dashboard" />}
              >
                Dashboard
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} text-[14px] text-muted-foreground hover:text-foreground`}
                render={<Link href="/agent-activity" />}
              >
                Agent activity
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            nativeButton={false}
            render={<Link href="/agent-activity" />}
            className="hidden h-10 rounded-full bg-brand px-4 text-[14px] text-brand-foreground hover:bg-brand/90 sm:inline-flex"
          >
            Try the demo
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            nativeButton={false}
            render={<Link href="/cart" aria-label="Cart" />}
            className={`relative ${ICON_BTN}`}
          >
            <ShoppingCart className="size-4" />
            {cart.count > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-foreground">
                {cart.count}
              </span>
            )}
          </Button>

          {/* Mobile — hamburger opens a shadcn Sheet sidebar (portaled, no layout shift) */}
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  aria-label="Open menu"
                  className={`lg:hidden ${ICON_BTN}`}
                />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[20rem] gap-0 p-0 sm:max-w-[20rem]">
              <SheetHeader className="border-b border-border p-5 pr-14">
                <SheetTitle className="flex items-center gap-3">
                  <Image src="/slashcheckout-mark.png" alt="" width={36} height={36} className="size-9 shrink-0" />
                  <span className="flex flex-col items-start gap-1">
                    <span className="text-[15px] font-medium leading-none">
                      SlashCheckout
                    </span>
                    <span className="text-[12px] font-normal leading-none text-muted-foreground">
                      Agentic commerce
                    </span>
                  </span>
                </SheetTitle>
              </SheetHeader>

              <div className="p-4 pb-2">
                <Button
                  nativeButton={false}
                  render={<Link href="/agent-activity" onClick={closeMobile} />}
                  className="h-11 w-full rounded-full bg-brand text-[14px] text-brand-foreground hover:bg-brand/90"
                >
                  Try the demo
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <ScrollArea className="min-h-0 flex-1">
                <nav className="flex flex-col gap-5 p-4" aria-label="Mobile">
                  {/* Shop */}
                  <section className="flex flex-col gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Shop
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_CATS.map((cat) => (
                        <Link
                          key={cat}
                          href={`/products?category=${encodeURIComponent(cat)}`}
                          onClick={closeMobile}
                          className="rounded-full border border-border bg-background px-4 py-2 text-[13px] text-foreground transition-colors hover:bg-muted"
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/products"
                      onClick={closeMobile}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-brand"
                    >
                      View all products
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </section>

                  <Separator />

                  {/* Explore */}
                  <section className="flex flex-col gap-2">
                    <p className="px-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Explore
                    </p>
                    <NavRow
                      href="/#how-it-works"
                      icon={PlayCircle}
                      title="How it works"
                      desc="Three steps, end to end"
                      onNavigate={closeMobile}
                    />
                    <NavRow
                      href="/dashboard"
                      icon={LayoutDashboard}
                      title="Dashboard"
                      desc="Revenue & audit trail"
                      onNavigate={closeMobile}
                    />
                    <NavRow
                      href="/agent-activity"
                      icon={Bot}
                      title="Agent activity"
                      desc="Watch them reason & buy"
                      onNavigate={closeMobile}
                    />
                    <NavRow
                      href="/cart"
                      icon={ShoppingBag}
                      title="Cart"
                      desc={
                        cart.count > 0
                          ? `${cart.count} item${cart.count === 1 ? "" : "s"} ready for quote`
                          : "No items yet"
                      }
                      onNavigate={closeMobile}
                    />
                  </section>
                </nav>
              </ScrollArea>

              <SheetFooter className="border-t border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <Moon className="size-4 text-muted-foreground" />
                    ) : (
                      <Sun className="size-4 text-muted-foreground" />
                    )}
                    <span className="text-[14px] font-medium text-foreground">
                      Dark mode
                    </span>
                  </div>
                  <Switch
                    checked={isDark}
                    onCheckedChange={(checked) =>
                      setTheme(checked ? "dark" : "light")
                    }
                    aria-label="Toggle dark mode"
                  />
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
