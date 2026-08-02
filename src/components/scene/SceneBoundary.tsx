import { Component, type ReactNode } from "react";

export class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { /* Preserve the functional non-WebGL UI. */ }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
