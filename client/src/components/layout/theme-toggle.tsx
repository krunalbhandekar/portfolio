"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTheme, useTheme } from "@/hooks/use-theme";

/**
 * Switches between dark (default) and light. The icon shows the theme you'd switch *to*; it
 * is chosen by CSS from `html[data-theme-pref]`, so it's correct before hydration.
 */
export function ThemeToggle() {
  const { theme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle theme"
    >
      <span data-theme-option="dark">
        <Sun aria-hidden="true" />
        <span className="sr-only">Switch to light theme</span>
      </span>
      <span data-theme-option="light">
        <Moon aria-hidden="true" />
        <span className="sr-only">Switch to dark theme</span>
      </span>
    </Button>
  );
}
