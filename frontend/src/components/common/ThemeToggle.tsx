import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`theme-toggle${isDark ? " theme-toggle--dark" : ""}`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span className="theme-toggle__knob">
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}
