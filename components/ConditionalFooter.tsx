"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Sign-in and sign-up are bare auth surfaces: no marketing link columns or
// newsletter above the fold of a form. Keep this list in sync with the auth
// routes under app/. The Footer itself stays a Server Component — it only
// travels through this gate as children.
const BARE_ROUTES = ["/login", "/register"];

export function ConditionalFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.includes(pathname)) {
    return null;
  }

  return children;
}
