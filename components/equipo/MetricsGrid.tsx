import { formatUSD } from "@/lib/format";
import type { ComercialConMetricas } from "@/lib/types";

interface MetricsGridProps {
  comercial: ComercialConMetricas;
}

function intOrZero(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? Math.trunc(v) : 0;
}

export function MetricsGrid({ comercial }: MetricsGridProps) {
  // Defensa contra campos faltantes/string en la view de Supabase.
  const activos = intOrZero(comercial.leads_activos);
  const ganadosMes = intOrZero(comercial.ganados_mes_cantidad);
  const ratio = Number(comercial.ratio_cierre) || 0;
  const frios = intOrZero(comercial.leads_frios);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Metric
        label="Activos"
        value={String(activos)}
        sub={formatUSD(comercial.pipeline_valor)}
        subStrong
      />
      <Metric
        label="Ganados mes"
        value={String(ganadosMes)}
        sub={formatUSD(comercial.ganados_mes_valor)}
        subStrong
      />
      <Metric
        label="Ratio cierre"
        value={`${Math.round(ratio)}%`}
        sub="últimos 90 días"
      />
      <Metric
        label="Leads frío"
        value={String(frios)}
        sub={
          frios === 0
            ? "al día"
            : frios >= 5
              ? "requieren atención"
              : "en atención"
        }
        valueAlert={frios >= 5}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
  subStrong = false,
  valueAlert = false,
}: {
  label: string;
  value: string;
  sub: string;
  subStrong?: boolean;
  valueAlert?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10.5px] text-muted font-semibold tracking-[0.05em] uppercase">
        {label}
      </span>
      <span
        className={`font-display font-semibold text-[19px] md:text-[20px] xl:text-[22px] -tracking-[0.018em] leading-none ${valueAlert ? "text-rojo" : "text-ink"}`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted mt-0.5">
        {subStrong ? (
          <strong className="text-ink-2 font-semibold">{sub}</strong>
        ) : (
          sub
        )}
      </span>
    </div>
  );
}
