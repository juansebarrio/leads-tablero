import {
  calcularDiasEnPipeline,
  formatFechaCorta,
  shortId,
} from "@/lib/lead-utils";
import type {
  EstadoOportunidad,
  LeadDetalle,
  Origen,
} from "@/lib/types";

interface LeadHeaderProps {
  lead: LeadDetalle;
}

const ORIGEN_LABEL: Record<Origen, string> = {
  formulario: "Formulario",
  referido: "Referido",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

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

export function LeadHeader({ lead }: LeadHeaderProps) {
  const heat = lead.estado_oportunidad;
  const dias = calcularDiasEnPipeline(lead.fecha_creacion);
  const fechaIngreso = formatFechaCorta(lead.fecha_creacion);

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="bg-line-2 text-ink-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
          {ORIGEN_LABEL[lead.origen]}
        </span>
        {heat && (
          <span
            className={`text-[10.5px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full ${HEAT_STYLE[heat].bg} ${HEAT_STYLE[heat].color}`}
          >
            {HEAT_LABEL[heat]}
          </span>
        )}
      </div>
      <h1
        className="font-display text-[26px] md:text-[32px] lg:text-[38px] font-medium leading-[1.05] -tracking-[0.025em] text-ink mb-2"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        {lead.nombre}
      </h1>
      <div className="text-[11px] md:text-[12px] text-muted-2">
        Lead #{shortId(lead.id)} · Ingresó el {fechaIngreso} · {dias}{" "}
        {dias === 1 ? "día" : "días"} en el pipeline
      </div>
    </div>
  );
}
