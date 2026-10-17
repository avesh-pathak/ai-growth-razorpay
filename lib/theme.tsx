"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

/**
 * Theme store backed by the <html> "dark" class.
 * - A pre-paint script in layout.tsx applies the stored theme before first paint.
 * - useSyncExternalStore keeps SSR ("light") and the hydrated client in sync
 *   without hydration mismatches or setState-in-effect.
 */
const listeners = new Set<() => void>();

const themeStore = {
  subscribe(callback: () => void) {
    listeners.add(callback);
    const onStorage = () => callback();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(callback);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): Theme {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  },
  getServerSnapshot(): Theme {
    return "light";
  },
  setTheme(theme: Theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("settle-theme", theme);
    } catch {
      /* private mode — class still applies for this session */
    }
    listeners.forEach((callback) => callback());
  },
};

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme: themeStore.setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
