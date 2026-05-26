import { formatUSD, formatUSDCorto } from "@/lib/format";
import type { Estado, PipelineEstado } from "@/lib/types";

interface PipelineBarProps {
  data: PipelineEstado[];
}

const ORDEN: Estado[] = [
  "nuevo",
  "conversacion",
  "propuesta",
  "cierre",
  "ganado",
];

const NOMBRE_ESTADO: Record<Estado, string> = {
  nuevo: "Nuevos",
  conversacion: "En conversación",
  propuesta: "Propuesta",
  cierre: "Cierre",
  ganado: "Ganados",
};

// Inline background por estado: usamos las CSS vars del @theme para no
// quemar hex en el TSX y mantener coherencia con el sistema.
const BG_ESTADO: Record<Estado, string> = {
  nuevo: "var(--color-azul-soft)",
  conversacion: "var(--color-azul)",
  propuesta: "var(--color-violeta)",
  cierre: "var(--color-coral)",
  ganado: "var(--color-ink)",
};

export function PipelineBar({ data }: PipelineBarProps) {
  // Ordenamos por el flujo del pipeline; rellenamos con ceros si falta alguno.
  const porEstado = new Map(data.map((d) => [d.estado, d]));
  const filas = ORDEN.map(
    (estado) =>
      porEstado.get(estado) ?? { estado, cantidad: 0, valor_total: 0 },
  );

  const totalActivo = filas
    .filter((f) => f.estado !== "ganado")
    .reduce((acc, f) => acc + f.valor_total, 0);

  // Fecha header dinámica: "mayo 2026"
  const mes = new Date().toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-panel border border-line rounded-lg p-4 md:p-5 mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-1 mb-4">
        <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-muted">
          Estado del pipeline · {mes}
        </div>
        <div className="text-[13px] text-muted">
          <strong className="font-display text-[19px] font-semibold text-ink mr-1.5 -tracking-[0.01em]">
            {formatUSD(totalActivo)}
          </strong>
          activos
        </div>
      </div>

      <div className="flex gap-1 h-2 mb-3.5">
        {filas.map((f) => (
          <div
            key={f.estado}
            className="rounded-sm"
            style={{
              flex: Math.max(f.cantidad, 1),
              background: BG_ESTADO[f.estado],
            }}
          />
        ))}
      </div>

      {/* Desktop: grid en columnas / Mobile: lista vertical */}
      <div
        className="hidden md:grid gap-1"
        style={{
          gridTemplateColumns: filas
            .map((f) => `${Math.max(f.cantidad, 1)}fr`)
            .join(" "),
        }}
      >
        {filas.map((f) => (
          <div key={f.estado} className="flex flex-col gap-1 min-w-0">
            <div className="text-[11px] text-muted font-medium truncate">
              {NOMBRE_ESTADO[f.estado]}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-semibold text-[18px] text-ink leading-none -tracking-[0.01em]">
                {f.cantidad}
              </span>
              <span className="text-[11px] text-muted font-medium">
                {formatUSDCorto(f.valor_total)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="md:hidden flex flex-col">
        {filas.map((f, i) => (
          <div
            key={f.estado}
            className={`flex justify-between items-center py-2.5 ${
              i < filas.length - 1 ? "border-b border-line-2" : ""
            }`}
          >
            <span className="text-[12.5px] text-muted font-medium">
              {NOMBRE_ESTADO[f.estado]}
            </span>
            <div className="flex items-baseline gap-2.5">
              <span className="font-display font-semibold text-base text-ink leading-none -tracking-[0.01em]">
                {f.cantidad}
              </span>
              <span className="text-[11px] text-muted font-medium">
                {formatUSDCorto(f.valor_total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
