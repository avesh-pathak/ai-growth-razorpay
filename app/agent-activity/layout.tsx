// app/agent-activity/layout.tsx — Passthrough layout for the agent-activity segment.
//
// The dev server's instant-navigation validator could not render this segment
// ("Could not validate `instant` because an error prevented the target segment
// from rendering" — the page instantiated its client reference proxy). The
// page itself is a Client Component, and `instant` config is not allowed in
// Client Components, so the documented opt-out lives here. Dev-only insight;
// it does not change rendering.
export const instant = false;

import type { ReactNode } from "react";

export default function AgentActivityLayout({ children }: { children: ReactNode }) {
  return children;
}
