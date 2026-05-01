import { create } from "zustand";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

const STORAGE_KEY = "prism-theme";
const storedTheme = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const initialDark = storedTheme !== null ? storedTheme === "dark" : true;

// Apply immediately to avoid flash-of-wrong-theme on page load
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", initialDark ? "dark" : "light");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: initialDark,
  toggle: () => {
    const next = !get().isDark;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    set({ isDark: next });
  },
}));
