"use client";

import { ThemeContextValue, Theme } from "@/types/types";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "cedarshop-theme";
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(listener: () => void) {
  themeListeners.add(listener);

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      themeListeners.forEach((notify) => notify());
    }
  };

  window.addEventListener("storage", handleStorageChange);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function saveTheme(theme: Theme) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  themeListeners.forEach((notify) => notify());
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = {
    theme,
    toggleTheme: () => saveTheme(theme === "dark" ? "light" : "dark"),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
