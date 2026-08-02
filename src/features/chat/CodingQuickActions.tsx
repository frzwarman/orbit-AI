const codingQuickActions = [
  ["Explain code", "Explain this code clearly, including its control flow and important trade-offs:\n\n"],
  ["Find bugs", "Find bugs and edge cases in this code, then suggest focused fixes:\n\n"],
  ["Improve TypeScript types", "Improve the TypeScript types in this code without changing its behavior:\n\n"],
  ["Refactor component", "Refactor this component for clarity and maintainability without over-engineering:\n\n"],
  ["Generate tests", "Generate focused tests for this code, covering behavior and important edge cases:\n\n"],
  ["Review accessibility", "Review this UI for accessibility issues and propose concrete fixes:\n\n"],
  ["Improve React performance", "Review this React code for meaningful performance improvements:\n\n"],
  ["Convert styles to Tailwind", "Convert these styles to maintainable Tailwind utilities:\n\n"],
] as const;

export function CodingQuickActions({ onSelect }: { onSelect: (instruction: string) => void }) {
  return (
    <div className="quick-actions" aria-label="Coding quick actions">
      {codingQuickActions.map(([label, instruction]) => (
        <button key={label} type="button" onClick={() => onSelect(instruction)}>{label}</button>
      ))}
    </div>
  );
}
