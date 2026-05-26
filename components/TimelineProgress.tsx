// Barra simple de "ritmo de contacto" con días frío.
// El width es proporcional a los días: 0 días = 0%, 12+ días = 100%.

interface TimelineProgressProps {
  diasFrio: number;
}

export function TimelineProgress({ diasFrio }: TimelineProgressProps) {
  const pct = Math.min(Math.max(diasFrio, 0) * 8, 100);
  // Umbral del sistema: >=8 días = rojo (frío crítico). <8 = warning amarillo.
  const esCritico = diasFrio >= 8;

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 max-w-[140px] h-1 rounded-sm bg-line relative">
        <div
          className="absolute left-0 top-0 h-full rounded-sm bg-rojo opacity-50"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap ${
          esCritico ? "text-rojo" : "text-amarillo"
        }`}
      >
        {diasFrio} {esCritico ? "días frío" : "días"}
      </span>
    </div>
  );
}
