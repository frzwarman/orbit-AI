import { Component, Suspense, type ReactNode } from "react";

import type { AssistantCharacter, AssistantState } from "../../types/assistant";
import { AnimatedModel } from "./AnimatedModel";
import { ProceduralHuman } from "./ProceduralHuman";

type Props = { character: AssistantCharacter; state: AssistantState; reducedMotion: boolean };

class ModelBoundary extends Component<Props & { children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch() { /* Local procedural fallback is intentional. */ }
  override render() {
    if (this.state.failed) return <ProceduralHuman character={this.props.character} state={this.props.state} />;
    return this.props.children;
  }
}

export function HumanAssistant(props: Props) {
  return (
    <ModelBoundary {...props}>
      <Suspense fallback={<ProceduralHuman {...props} />}>
        <AnimatedModel {...props} />
      </Suspense>
    </ModelBoundary>
  );
}
