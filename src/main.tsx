import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Orbit root element was not found");
}

// R3F owns a stateful WebGL renderer. React's development-only StrictMode
// remount forcibly destroys that renderer and reports a misleading context loss.
createRoot(root).render(<App />);
