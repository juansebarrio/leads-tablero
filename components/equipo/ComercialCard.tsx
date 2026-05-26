import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  ComercialInsight,
  type Insight,
} from "@/components/equipo/ComercialInsight";
import { MetaProgress } from "@/components/equipo/MetaProgress";
import { MetricsGrid } from "@/components/equipo/MetricsGrid";
import { formatUSD } from "@/lib/format";
import type { ComercialConMetricas } from "@/lib/types";

interface ComercialCardProps {
  comercial: ComercialConMetricas;
  diasRestantes: number;
}

export function ComercialCard({ comercial, diasRestantes }: ComercialCardProps) {
  const insight = computeInsight(comercial);

  return (
    <Link
      href={`/pipeline?comercial=${comercial.id}`}
      aria-label={`Ver pipeline de ${comercial.nombre}`}
      className="
        group relative bg-panel border border-line rounded-[10px] p-[18px] xl:p-[22px] flex flex-col gap-4
        transition-[transform,box-shadow,border-color] duration-150 ease-out cursor-pointer
        hover:border-ink-2 hover:-translate-y-0.5
        hover:shadow-[0_12px_32px_rgba(14,14,18,0.06),0_2px_8px_rgba(14,14,18,0.04)]
      "
    >
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
          style={{ background: comercial.avatar_gradient }}
        >
          {comercial.iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="font-display font-medium text-[17px] md:text-[18px] xl:text-[19px] -tracking-[0.015em] leading-tight text-ink mb-0.5"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {comercial.nombre}
          </div>
          <div className="text-[11.5px] text-muted">
            Comercial · {comercial.leads_activos} leads
          </div>
        </div>
        <ChevronRight
          className="w-4 h-4 text-muted-2 shrink-0 transition-[color,transform] group-hover:text-violeta group-hover:translate-x-0.5"
          strokeWidth={2}
        />
      </div>

      <MetaProgress
        ganado={comercial.ganados_mes_valor}
        meta={comercial.meta_mensual}
        diasRestantes={diasRestantes}
      />

      <MetricsGrid comercial={comercial} />

      {insight && <ComercialInsight insight={insight} />}
    </Link>
  );
}

// Insight contextual: la regla más fuerte gana. null si no aplica ninguna.
function computeInsight(c: ComercialConMetricas): Insight | null {
  const progresoMeta =
    c.meta_mensual > 0 ? (c.ganados_mes_valor / c.meta_mensual) * 100 : 0;

  // 1) Sobrecargado: muchos leads frío.
  if (c.leads_frios >= 5) {
    return {
      tipo: "danger",
      texto: (
        <>
          <strong className="font-bold">{c.leads_frios} leads frío</strong> sin
          contacto +5 días. Sobrecargado.
        </>
      ),
      action: {
        label: "Reasignar →",
        href: `/pipeline?comercial=${c.id}`,
      },
    };
  }
  // 2) Mejor ratio del mes (umbral 18%+).
  if (c.ratio_cierre >= 18) {
    return {
      tipo: "good",
      texto: (
        <>
          El mejor ratio del mes.{" "}
          <strong className="font-bold">
            Meta {progresoMeta >= 100 ? "superada" : "al alcance"}.
          </strong>
        </>
      ),
    };
  }
  // 3) En racha (meta 80-99%).
  if (progresoMeta >= 80 && progresoMeta < 100) {
    const falta = Math.max(0, c.meta_mensual - c.ganados_mes_valor);
    return {
      tipo: "good",
      texto: (
        <>
          En racha. Le falta{" "}
          <strong className="font-bold">{formatUSD(falta)}</strong> para la
          meta.
        </>
      ),
    };
  }
  // 4) Meta lejos (warn).
  if (progresoMeta < 50) {
    return {
      tipo: "warn",
      texto: (
        <>
          Va por <strong className="font-bold">{Math.round(progresoMeta)}%</strong>{" "}
          de la meta. Quedan pocos días.
        </>
      ),
    };
  }
  return null;
}
