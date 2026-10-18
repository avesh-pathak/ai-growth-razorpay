// app/login/page.tsx — Sign in (merchant + buyer share this door)

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Desktop keeps the autofocus; touch devices skip it so the software
  // keyboard doesn't pop open (and scroll the page) on arrival.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("invalid login")) {
        setError("Wrong email or password. Try again.");
      } else if (msg.includes("email not confirmed")) {
        setError("This account still needs email confirmation. Confirm via the email link, then sign in.");
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Role-based routing: owner/admin -> merchant dashboard, everyone else -> buyer storefront.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
    const role = profile?.role ?? "viewer";

    router.push(role === "owner" || role === "admin" ? "/dashboard" : "/products");
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Merchant and buyer accounts both sign in here."
      footer={
        <>
          New to SlashCheckout?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email" className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            ref={emailRef}
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
            placeholder="••••••••"
            autoComplete="current-password"
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

        <Button
          type="submit"
          disabled={loading}
          className="mt-1 h-11 w-full rounded-full bg-brand text-[14px] font-medium text-brand-foreground hover:bg-brand/90 sm:h-10"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
