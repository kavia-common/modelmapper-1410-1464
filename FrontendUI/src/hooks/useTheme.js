import { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export default function useTheme() {
  /** Hook to manage document theme attribute */
  const [theme, setTheme] = useState(
    () => localStorage.getItem("mm_theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mm_theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return { theme, setTheme, toggleTheme };
}
