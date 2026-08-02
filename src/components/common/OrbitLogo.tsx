type OrbitLogoProps = { compact?: boolean };

export function OrbitLogo({ compact = false }: OrbitLogoProps) {
  return (
    <div className="inline-flex items-center gap-3" aria-label="Orbit">
      <span className="relative grid size-9 shrink-0 place-items-center" aria-hidden="true">
        <span className="absolute inset-1 rounded-full border border-cyan-300/70" />
        <span className="absolute inset-0 rotate-45 rounded-[50%] border border-violet-400/50" />
        <span className="size-2 rounded-full bg-cyan-200 shadow-[0_0_16px_#55e6ff]" />
      </span>
      {!compact && <span className="text-lg font-semibold tracking-[0.18em] text-white">ORBIT</span>}
    </div>
  );
}
