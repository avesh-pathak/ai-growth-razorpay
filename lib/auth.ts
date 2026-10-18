// lib/auth.ts — server-side session/profile helpers for Route Handlers

import { createClient } from "@/lib/supabase/server";

export type SessionProfile = {
  userId: string;
  email: string | null;
  role: "owner" | "admin" | "viewer" | "buyer";
};

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "viewer") as SessionProfile["role"];
  return { userId: user.id, email: user.email ?? null, role };
}

export function isMerchant(profile: SessionProfile | null): boolean {
  return !!profile && (profile.role === "owner" || profile.role === "admin");
}
