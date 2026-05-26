"use client";

import {
  AnimatedCounter,
  formatInt,
  formatUSDCounter,
} from "@/components/pipeline/AnimatedCounter";
import type { Estado } from "@/lib/types";

interface ColumnHeaderProps {
  estado: Estado;
  nombre: string;
  cantidad: number;
  valorTotal: number;
  // Texto sub que cambia por estado.
  sub: string;
}

// Barra accent que sube por arriba de cada columna.
// 'perdido' nunca se renderiza como columna del kanban; lo incluimos en el
// Record por completitud del tipo Estado.
const ACCENT_BG: Record<Estado, string> = {
  nuevo: "var(--color-azul-soft)",
  conversacion: "var(--color-azul)",
  propuesta: "var(--color-violeta)",
  cierre: "var(--color-coral)",
  ganado: "var(--color-verde)",
  perdido: "var(--color-rojo)",
};

export function ColumnHeader({
  estado,
  nombre,
  cantidad,
  valorTotal,
  sub,
}: ColumnHeaderProps) {
  const isGanado = estado === "ganado";
  return (
    <div
      className={`relative p-4 pb-3.5 border-b ${isGanado ? "border-[#C9E2D2]" : "border-line"}`}
    >
      {/* Accent bar 3px arriba */}
      <span
        aria-hidden
        className="absolute top-0 left-4 right-4 h-[3px] rounded-b-sm"
        style={{ background: ACCENT_BG[estado] }}
      />
      <div className="flex items-baseline justify-between mb-2">
        <span
          className={`text-[11.5px] font-semibold tracking-[0.05em] uppercase ${isGanado ? "text-verde" : "text-muted"}`}
        >
          {nombre}
        </span>
        <span
          className={`font-display font-semibold text-[14px] leading-[1.3] px-2 py-px rounded-full border ${
            isGanado
              ? "bg-white border-[#C9E2D2] text-verde"
              : "bg-panel border-line text-ink"
          }`}
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          <AnimatedCounter value={cantidad} format={formatInt} />
        </span>
      </div>
      <div
        className={`font-display font-semibold text-[18px] xl:text-[20px] -tracking-[0.015em] leading-none ${isGanado ? "text-verde" : "text-ink"}`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        <AnimatedCounter value={valorTotal} format={formatUSDCounter} />
      </div>
      <div className="text-[10.5px] xl:text-[11px] text-muted mt-1">{sub}</div>
    </div>
  );
}
