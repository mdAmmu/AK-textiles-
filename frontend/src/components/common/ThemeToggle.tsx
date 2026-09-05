import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={`relative w-[46px] h-[26px] shrink-0 border-none rounded-full cursor-pointer p-[3px] flex items-center transition-[background] duration-200 ease-in-out ${
        isDark ? "bg-[#2563eb]" : "bg-[#dadedb]"
      }`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className={`w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ease-in-out ${
          isDark ? "translate-x-5 text-[#2563eb]" : "translate-x-0 text-[#7c827e]"
        }`}
      >
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </span>
    </button>
  );
}
