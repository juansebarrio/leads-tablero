import { TrendingDown, TrendingUp } from "lucide-react";
import type { CerradosKpis, MetaMes } from "@/lib/types";

interface Props {
  kpis: CerradosKpis;
  meta: MetaMes;
}

// Banda de 4 KPIs arriba de /cerrados. Cada card tiene su accent color y
// un delta vs mes anterior cuando aplica.
export function KpiStripCierre({ kpis, meta }: Props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3 mb-7">
      <KpiCard
        label="Ganados"
        valor={String(kpis.ganados_cantidad)}
        valorClass="text-verde"
        accent="var(--color-verde)"
        delta={
          kpis.delta_ganados_pct == null
            ? null
            : {
                value: `${kpis.delta_ganados_pct > 0 ? "+" : ""}${kpis.delta_ganados_pct}%`,
                direction:
                  kpis.delta_ganados_pct > 0
                    ? "up"
                    : kpis.delta_ganados_pct < 0
                      ? "down"
                      : "neutral",
                sub: "vs mes anterior",
              }
        }
      />
      <KpiCard
        label="Valor cerrado"
        valor={`USD ${kpis.valor_cerrado.toLocaleString("es-AR")}`}
        accent="linear-gradient(90deg, var(--color-verde), var(--color-azul))"
        delta={{
          value: `${kpis.pct_meta}% de meta`,
          direction: kpis.pct_meta >= 100 ? "up" : "neutral",
          sub: `meta USD ${meta.valor.toLocaleString("es-AR")}`,
        }}
      />
      <KpiCard
        label="Perdidos"
        valor={String(kpis.perdidos_cantidad)}
        valorClass="text-rojo"
        accent="var(--color-rojo)"
        delta={
          kpis.valor_perdido > 0
            ? {
                value: `USD ${kpis.valor_perdido.toLocaleString("es-AR")} caídos`,
                direction: "neutral",
                sub: "",
              }
            : {
                value: "sin pérdidas",
                direction: "up",
                sub: "este mes",
              }
        }
      />
      <KpiCard
        label="Ratio cierre"
        valor={`${kpis.ratio_cierre}%`}
        accent="var(--color-violeta)"
        delta={{
          value: `${kpis.ganados_cantidad} de ${kpis.ganados_cantidad + kpis.perdidos_cantidad}`,
          direction: "neutral",
          sub: "ganados vs cerrados",
        }}
      />
    </div>
  );
}

type Delta = {
  value: string;
  direction: "up" | "down" | "neutral";
  sub: string;
};

function KpiCard({
  label,
  valor,
  valorClass,
  accent,
  delta,
}: {
  label: string;
  valor: string;
  valorClass?: string;
  accent: string;
  delta: Delta | null;
}) {
  return (
    <div className="relative bg-panel border border-line rounded-[10px] px-5 py-[18px] md:p-[20px] md:px-[22px] overflow-hidden">
      <span
        aria-hidden
        className="absolute top-0 left-[22px] right-[22px] h-[3px] rounded-b-sm"
        style={{ background: accent }}
      />
      <div className="text-[10.5px] text-muted font-semibold tracking-[0.05em] uppercase mb-2.5">
        {label}
      </div>
      <div
        className={`font-display font-semibold text-[22px] md:text-[26px] xl:text-[28px] -tracking-[0.02em] leading-none mb-2 ${valorClass ?? "text-ink"}`}
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        {valor}
      </div>
      {delta && (
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-[2px] rounded-full ${
              delta.direction === "up"
                ? "bg-verde-soft text-verde"
                : delta.direction === "down"
                  ? "bg-rojo-soft text-rojo"
                  : "bg-line-2 text-muted"
            }`}
          >
            {delta.direction === "up" && (
              <TrendingUp className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            {delta.direction === "down" && (
              <TrendingDown className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            {delta.value}
          </span>
          {delta.sub && (
            <span className="text-[11.5px] text-muted">{delta.sub}</span>
          )}
        </div>
      )}
    </div>
  );
}
