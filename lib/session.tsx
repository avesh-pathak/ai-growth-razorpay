"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Auth session store backed by Supabase's onAuthStateChange.
 * - Subscribing fires INITIAL_SESSION immediately, so the first callback
 *   delivers the current session (or null) without a separate getSession().
 * - Server + first client render report "loading", so SSR HTML and hydration
 *   agree; the real state arrives one tick later.
 * - Module-level store: every consumer shares one subscription, and the state
 *   survives client-side navigation (the header is in the root layout).
 */
export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; email: string };

const LOADING: SessionState = { status: "loading" };

let state: SessionState = LOADING;
const listeners = new Set<() => void>();
let started = false;

function sameState(a: SessionState, b: SessionState): boolean {
  if (a.status !== b.status) return false;
  if (a.status === "signed-in" && b.status === "signed-in") {
    return a.email === b.email;
  }
  return true;
}

function setState(next: SessionState) {
  // Skip no-op updates (token refreshes etc.) so consumers don't re-render.
  if (sameState(state, next)) return;
  state = next;
  listeners.forEach((listener) => listener());
}

function toState(session: Session | null): SessionState {
  return session?.user
    ? { status: "signed-in", email: session.user.email ?? "" }
    : { status: "signed-out" };
}

function start() {
  if (started) return;
  started = true;
  try {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((_event, session) => {
      setState(toState(session));
    });
  } catch {
    // Supabase env not configured — treat as signed out rather than crashing
    // every page that renders the header.
    started = false;
    setState({ status: "signed-out" });
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): SessionState {
  return state;
}

function getServerSnapshot(): SessionState {
  return LOADING;
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
