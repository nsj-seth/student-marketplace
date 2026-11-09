import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const storageKey = "marketplace-theme";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | undefined>(undefined);

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content", theme === "dark" ? "#111522" : "#f8f9fc"
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useRef<Theme | null>(savedTheme());
  const [theme, setTheme] = useState<Theme>(
    () => document.documentElement.dataset.theme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    function syncPreference() {
      preference.current = savedTheme();
      const next = preference.current ?? (system.matches ? "dark" : "light");
      applyTheme(next);
      setTheme(next);
    }
    function syncSystem() {
      if (preference.current === null) syncPreference();
    }
    function syncStorage(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) syncPreference();
    }
    system.addEventListener("change", syncSystem);
    window.addEventListener("storage", syncStorage);
    return () => {
      system.removeEventListener("change", syncSystem);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    preference.current = next;
    applyTheme(next);
    setTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // The toggle remains usable when persistent storage is unavailable.
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
