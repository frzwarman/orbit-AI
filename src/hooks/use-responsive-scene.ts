import { useEffect, useState } from "react";

export type ResponsiveSceneMode = "compact" | "simplified" | "full";

export function getResponsiveSceneMode(width: number): ResponsiveSceneMode {
  if (width < 768) return "compact";
  if (width < 1200) return "simplified";
  return "full";
}

export function useResponsiveScene(): ResponsiveSceneMode {
  const [mode, setMode] = useState(() => getResponsiveSceneMode(typeof window === "undefined" ? 1200 : window.innerWidth));

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      const updateFromWidth = () => setMode(getResponsiveSceneMode(window.innerWidth));
      window.addEventListener("resize", updateFromWidth);
      return () => window.removeEventListener("resize", updateFromWidth);
    }
    const compact = window.matchMedia("(max-width: 767px)");
    const full = window.matchMedia("(min-width: 1200px)");
    const update = () => setMode(compact.matches ? "compact" : full.matches ? "full" : "simplified");
    update();
    compact.addEventListener("change", update);
    full.addEventListener("change", update);
    return () => {
      compact.removeEventListener("change", update);
      full.removeEventListener("change", update);
    };
  }, []);

  return mode;
}
