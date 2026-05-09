"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      aria-pressed={mounted && resolvedTheme === "dark"}
      title="Toggle theme"
      onClick={() => {
        if (!mounted) return;
        // Avoid relying on theme during SSR. After mount, resolvedTheme is stable.
        const isDark = resolvedTheme === "dark";
        setTheme(isDark ? "light" : "dark");
      }}
      disabled={!mounted}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

