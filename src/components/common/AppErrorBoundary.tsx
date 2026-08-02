import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Orbit encountered an unrecoverable interface error", error, info);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="app-root grid place-items-center bg-[#050816] text-center" aria-labelledby="orbit-error-title">
        <section className="glass-panel max-w-md p-8">
          <p className="eyebrow">Orbit paused</p>
          <h1 id="orbit-error-title" className="mt-3 text-3xl font-semibold text-white">
            Something went off course
          </h1>
          <p className="mt-3 text-slate-300">Reload the page to reconnect with your workspace.</p>
          <button className="primary-button mt-6" type="button" onClick={() => window.location.reload()}>
            Reload Orbit
          </button>
        </section>
      </main>
    );
  }
}
