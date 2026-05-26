import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatUSD, formatHora } from "@/lib/format";
import type {
  EstadoOportunidad,
  OportunidadDia,
  Temperatura,
} from "@/lib/types";

interface OpportunityCardProps {
  opp: OportunidadDia;
}

const HEAT_LABEL: Record<EstadoOportunidad, string> = {
  caliente: "Caliente",
  esperando_firma: "Esperando firma",
  por_reactivar: "Por reactivar",
  sin_asignar: "Sin asignar",
};

const HEAT_STYLE: Record<EstadoOportunidad, { bg: string; color: string }> = {
  caliente: { bg: "bg-rojo-soft", color: "text-rojo" },
  esperando_firma: { bg: "bg-amarillo-soft", color: "text-amarillo" },
  por_reactivar: { bg: "bg-violeta-soft", color: "text-violeta" },
  sin_asignar: { bg: "bg-turquesa-soft", color: "text-[#2E8FA8]" },
};

const DOT_BG: Record<Temperatura, string> = {
  hot: "bg-rojo",
  warm: "bg-amarillo",
  med: "bg-violeta",
  cool: "bg-turquesa",
};

export function OpportunityCard({ opp }: OpportunityCardProps) {
  const heat = opp.estado_oportunidad ?? "por_reactivar";
  const heatStyle = HEAT_STYLE[heat];
  const nextLabel = opp.proximo_paso_fecha
    ? labelProximoPaso(opp.proximo_paso_fecha)
    : "Sin fecha";

  return (
    <div className="bg-panel border border-line rounded-lg p-4 md:p-5 flex flex-col gap-3.5">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_BG[opp.temperatura]}`} />
          <span className="font-display font-medium text-base md:text-lg leading-tight -tracking-[0.015em] text-ink truncate">
            {opp.nombre}
          </span>
        </div>
        <span
          className={`text-[10.5px] font-bold tracking-[0.06em] uppercase whitespace-nowrap px-2 py-1 rounded-full shrink-0 ${heatStyle.bg} ${heatStyle.color}`}
        >
          {HEAT_LABEL[heat]}
        </span>
      </div>

      <div className="bg-panel-2 rounded-md px-3.5 py-3 border border-line-2">
        <div className="text-[10px] text-muted font-semibold tracking-[0.06em] uppercase mb-1">
          Próximo paso · {nextLabel}
        </div>
        <div className="text-[13px] text-ink font-medium leading-snug">
          {opp.proximo_paso ?? "Definir"}
        </div>
      </div>

      <div className="flex justify-between items-center text-[12px] text-muted">
        <span className="font-display font-semibold text-[15px] text-ink -tracking-[0.01em]">
          {formatUSD(opp.valor_estimado)}
        </span>
        <Link
          href={`/lead/${opp.id}`}
          className="text-ink font-semibold cursor-pointer hover:text-violeta inline-flex items-center gap-1 text-[12px]"
        >
          Abrir ficha <ArrowRight className="w-3 h-3" strokeWidth={2.2} />
        </Link>
      </div>
    </div>
  );
}

function labelProximoPaso(iso: string): string {
  const fecha = new Date(iso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioFecha = new Date(fecha);
  inicioFecha.setHours(0, 0, 0, 0);

  const diffDias = Math.round(
    (inicioFecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDias < 0) return `vencido ${Math.abs(diffDias)}d`;
  if (diffDias === 0) return `hoy ${formatHora(iso)}`;
  if (diffDias === 1) return "vence mañana";
  if (diffDias <= 6) return "esta semana";
  return fecha.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}
