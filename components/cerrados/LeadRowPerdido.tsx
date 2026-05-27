import Link from "next/link";
import type { MotivoPerdida, PerdidoMes } from "@/lib/types";
import { ESTADO_LABEL } from "@/lib/lead-utils";
import { formatFechaCorta } from "@/lib/lead-utils";
import type { Estado } from "@/lib/types";

interface Props {
  lead: PerdidoMes;
  esUltimo: boolean;
}

const MOTIVO_LABEL: Record<MotivoPerdida, string> = {
  precio: "Precio",
  timing: "Timing",
  competencia: "Competencia",
  no_respondio: "No respondió",
  cambio_necesidad: "Cambio",
  otro: "Otro",
};

// Tags por motivo. Mantienen el código de color del sistema.
const MOTIVO_TAG: Record<MotivoPerdida, string> = {
  precio: "bg-[#FCE0DD] text-[#9B2B23]",
  timing: "bg-amarillo-soft text-amarillo",
  competencia: "bg-[#E6E8FF] text-[#4B5BAB]",
  no_respondio: "bg-[#ECEDF1] text-[#5C6271]",
  cambio_necesidad: "bg-violeta-soft text-violeta",
  otro: "bg-line-2 text-muted",
};

export function LeadRowPerdido({ lead, esUltimo }: Props) {
  const motivo = lead.motivo_perdida;
  const tagClass = motivo ? MOTIVO_TAG[motivo] : "bg-line-2 text-muted";
  const motivoText = motivo ? MOTIVO_LABEL[motivo] : "Sin motivo";
  const estadoPrevioLabel = lead.estado_previo
    ? ESTADO_LABEL[lead.estado_previo as Estado] ?? lead.estado_previo
    : null;

  return (
    <div
      className={`grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_22px_120px_auto] gap-2 md:gap-4 items-center py-3.5 ${
        esUltimo ? "" : "border-b border-line-2"
      }`}
    >
      <div className="min-w-0">
        <div className="font-semibold text-ink text-[13.5px] mb-[3px] truncate">
          {lead.nombre}
        </div>
        <div className="text-[11.5px] text-muted flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-[7px] py-[1px] rounded-full text-[10px] font-semibold tracking-[0.04em] uppercase ${tagClass}`}
          >
            {motivoText}
          </span>
          {lead.detalle_perdida && (
            <>
              <span
                aria-hidden
                className="w-[3px] h-[3px] rounded-full bg-muted-2 shrink-0"
              />
              <span className="truncate">{lead.detalle_perdida}</span>
            </>
          )}
        </div>
      </div>
      <div className="hidden md:block text-[11.5px] text-muted whitespace-nowrap">
        perdido {formatFechaCorta(lead.fecha_cierre_efectiva)}
        {estadoPrevioLabel ? ` · estaba en ${estadoPrevioLabel}` : ""}
      </div>
      {lead.responsable_iniciales && lead.responsable_avatar ? (
        <span
          className="w-[22px] h-[22px] rounded-full hidden md:flex items-center justify-center text-white text-[9px] font-bold shrink-0"
          style={{ background: lead.responsable_avatar }}
          title={lead.responsable_nombre ?? ""}
        >
          {lead.responsable_iniciales}
        </span>
      ) : (
        <span
          className="w-[22px] h-[22px] rounded-full hidden md:flex items-center justify-center text-muted text-[9px] font-bold shrink-0 bg-line border border-dashed border-muted-2"
          title="Sin asignar"
        >
          ?
        </span>
      )}
      <div
        className="font-display font-semibold text-[15px] -tracking-[0.01em] text-rojo whitespace-nowrap text-right"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        USD {lead.valor_estimado.toLocaleString("es-AR")}
      </div>
      <Link
        href={`/lead/${lead.id}`}
        className="hidden md:inline text-[11.5px] text-muted font-medium hover:text-violeta"
      >
        Ver ficha →
      </Link>
    </div>
  );
}
