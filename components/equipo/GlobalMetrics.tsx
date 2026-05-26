import { formatUSD } from "@/lib/format";
import type { EquipoMetricas } from "@/lib/types";

interface GlobalMetricsProps {
  metricas: EquipoMetricas;
}

// Banda de 4 métricas globales del equipo. Accent bar arriba con gradiente
// que recorre toda la paleta de marca.
export function GlobalMetrics({ metricas }: GlobalMetricsProps) {
  return (
    <div className="relative bg-panel border border-line rounded-[10px] p-5 md:p-[22px] md:px-6 mb-8 grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
      <span
        aria-hidden
        className="absolute top-0 left-5 md:left-6 right-5 md:right-6 h-[3px] rounded-b-sm"
        style={{
          background:
            "linear-gradient(90deg, var(--color-azul) 0%, var(--color-violeta) 40%, var(--color-coral) 70%, var(--color-verde) 100%)",
        }}
      />
      <Item
        label="Leads activos"
        value={String(metricas.leads_activos)}
        sub="en el pipeline ahora"
      />
      <Item
        label="Pipeline total"
        value={formatUSD(metricas.pipeline_valor)}
        sub="en juego"
      />
      <Item
        label="Ganados del mes"
        value={formatUSD(metricas.ganados_mes_valor)}
        sub={subGanados(metricas.ganados_mes_cantidad)}
      />
      <Item
        label="Ratio de cierre"
        value={`${Math.round(Number(metricas.ratio_cierre) || 0)}%`}
        sub="últimos 90 días"
      />
    </div>
  );
}

function subGanados(cantidad: number | null | undefined): string {
  const n = Number(cantidad);
  if (!Number.isFinite(n) || n === 0) return "sin cierres todavía";
  return `${n} ${n === 1 ? "lead cerrado" : "leads cerrados"}`;
}

function Item({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] md:text-[11px] text-muted font-semibold tracking-[0.05em] uppercase mb-2 md:mb-2.5">
        {label}
      </div>
      <div
        className="font-display font-semibold text-[22px] md:text-[24px] xl:text-[28px] -tracking-[0.02em] leading-none text-ink mb-1"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </div>
      <div className="text-[11.5px] text-muted">{sub}</div>
    </div>
  );
}
