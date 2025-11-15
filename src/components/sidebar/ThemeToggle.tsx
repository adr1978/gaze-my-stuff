"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted) {
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(isDark);
    }
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  if (!isMounted) {
    // Render a placeholder or null to avoid hydration mismatch
    return <div className="w-24 h-12" />; // Placeholder with same size
  }

  return (
    <button
      aria-label={
        isDarkMode ? "Activate light mode" : "Activate dark mode"
      }
      onClick={toggleTheme}
      className={cn(
        "relative w-24 h-12 rounded-full p-1 flex items-center transition-colors duration-500 ease-in-out",
        isDarkMode ? "bg-slate-800" : "bg-sky-400"
      )}
    >
      {/* Background Stars (Dark Mode) */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-in-out",
          isDarkMode ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="absolute top-3 left-4 w-0.5 h-0.5 bg-white rounded-full" />
        <div className="absolute top-2 left-14 w-1 h-1 bg-white rounded-full" />
        <div className="absolute top-8 left-16 w-0.5 h-0.5 bg-white rounded-full" />
        <div className="absolute top-6 left-6 w-0.5 h-0.5 bg-white rounded-full" />
      </div>

      {/* Background Clouds (Light Mode) */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700 ease-in-out",
          isDarkMode ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="absolute top-2 left-3 w-8 h-8 bg-white/30 rounded-full" />
        <div className="absolute top-1 left-10 w-10 h-10 bg-white/30 rounded-full" />
        <div className="absolute top-4 left-6 w-12 h-12 bg-white/30 rounded-full" />
      </div>

      {/* Handle (Sun/Moon) */}
      <div
        className={cn(
          "relative w-10 h-10 rounded-full transition-all duration-500 ease-in-out",
          // Light mode (Sun)
          !isDarkMode && "bg-yellow-400 translate-x-0 rotate-0",
          // Dark mode (Moon)
          isDarkMode && "bg-slate-300 translate-x-12 rotate-360"
        )}
      >
        {/* Moon Craters (visible in dark mode) */}
        <div
          className={cn(
            "absolute top-2 left-2 w-3 h-3 bg-slate-400/50 rounded-full transition-opacity duration-500 ease-in-out",
            isDarkMode ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute top-5 left-6 w-2 h-2 bg-slate-400/50 rounded-full transition-opacity duration-500 ease-in-out",
            isDarkMode ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute top-1 left-5 w-1.5 h-1.5 bg-slate-400/50 rounded-full transition-opacity duration-500 ease-in-out",
            isDarkMode ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </button>
  );
}