"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setTheme, useTheme, type Theme } from "@/hooks/use-theme";

const order: Theme[] = ["system", "light", "dark"];

const options = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/**
 * Cycles System → Light → Dark. The visible icon (and accessible name) is chosen by CSS
 * from `html[data-theme-pref]`, so it is correct before hydration with no mismatch.
 */
export function ThemeToggle() {
  const { theme } = useTheme();
  const next = order[(order.indexOf(theme) + 1) % order.length]!;

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} title="Change theme">
      {options.map(({ value, label, icon: Icon }) => (
        <span key={value} data-theme-option={value}>
          <Icon aria-hidden="true" />
          <span className="sr-only">Theme: {label}. Change theme</span>
        </span>
      ))}
    </Button>
  );
}
