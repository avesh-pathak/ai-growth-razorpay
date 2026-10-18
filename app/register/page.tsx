// app/register/page.tsx — Create account (buyer / merchant)

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Account types map to the roles stored in Supabase Auth user metadata:
//  - Merchant -> "owner" (merchant dashboard access)
//  - Buyer    -> "viewer" (buyer experience; owner/admin are merchant roles)
const ACCOUNT_TYPES = [
  { value: "buyer", label: "Buyer", desc: "Shop, or let your agent buy", icon: ShoppingBag },
  { value: "merchant", label: "Merchant", desc: "Sell, price, and run the gate", icon: Store },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"buyer" | "merchant">("buyer");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const supabase = createClient();
    const metadataRole = accountType === "merchant" ? "owner" : "viewer";

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: metadataRole } },
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Safety net: if email confirmation were ever enabled, no session is returned.
    if (!data.session) {
      setNotice("Account created. Check your email to confirm your address, then sign in.");
      setLoading(false);
      return;
    }

    router.push(accountType === "merchant" ? "/dashboard" : "/products");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Choose how you want to use SlashCheckout."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            Account type
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_TYPES.map(({ value, label, desc, icon: Icon }) => {
              const selected = accountType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value)}
                  aria-pressed={selected}
                  className={cn(
                    "flex min-h-11 flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-colors",
                    selected
                      ? "border-brand/50 bg-brand/5 ring-1 ring-brand/30"
                      : "border-border bg-background hover:bg-muted/60",
                  )}
                >
                  <span className="flex items-center gap-2 text-[14px] font-medium text-foreground">
                    <Icon className={cn("size-4", selected ? "text-brand" : "text-muted-foreground")} />
                    {label}
                  </span>
                  <span className="text-[12px] leading-snug text-muted-foreground">{desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email" className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-11 border-input bg-background px-3.5 text-[16px] sm:h-10 sm:text-[14px]"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            Password
          </Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-[13px] leading-[1.5] text-destructive"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="rounded-xl border border-brand/30 bg-brand/5 px-3.5 py-2.5 text-[13px] leading-[1.5] text-foreground"
          >
            {notice}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-11 w-full rounded-full bg-brand text-[14px] font-medium text-brand-foreground hover:bg-brand/90 sm:h-10"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
