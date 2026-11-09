import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  return (
    <Button
      type="button"
      variant="outline"
      aria-label={label}
      title={label}
      onClick={toggleTheme}
      className="h-11 shrink-0 gap-2 bg-card px-3 text-foreground"
    >
      {theme === "light" ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
      <span className="hidden text-sm 2xl:inline">{theme === "light" ? "Dark mode" : "Light mode"}</span>
    </Button>
  );
}
