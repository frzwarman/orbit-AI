import { useState } from "react";

import { supportsWebGL } from "../lib/three/capabilities";

export function useWebGLSupport(): boolean {
  const [supported] = useState(() => typeof document !== "undefined" && supportsWebGL());
  return supported;
}
