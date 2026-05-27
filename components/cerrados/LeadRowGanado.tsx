import Link from "next/link";
import type { GanadoMes } from "@/lib/types";
import { formatFechaCorta } from "@/lib/lead-utils";

interface Props {
  lead: GanadoMes;
  esUltimo: boolean;
}

const ORIGEN_LABEL: Record<string, string> = {
  formulario: "Formulario web",
  referido: "Referido",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

export function LeadRowGanado({ lead, esUltimo }: Props) {
  const tagText =
    lead.tipo_negocio === "recurrente"
      ? lead.meses_compromiso
        ? `Recurrente · ${lead.meses_compromiso} m`
        : "Recurrente"
      : "Proyecto";

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
          <span className="bg-line-2 text-ink-2 px-[7px] py-[1px] rounded-full text-[10px] font-semibold tracking-[0.04em] uppercase">
            {tagText}
          </span>
          <span
            aria-hidden
            className="w-[3px] h-[3px] rounded-full bg-muted-2"
          />
          <span>{ORIGEN_LABEL[lead.origen] ?? lead.origen}</span>
        </div>
      </div>
      <div className="hidden md:block text-[11.5px] text-muted whitespace-nowrap">
        cerrado {formatFechaCorta(lead.fecha_cierre_efectiva)} · tardó{" "}
        {lead.dias_cierre} {lead.dias_cierre === 1 ? "día" : "días"}
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
        className="font-display font-semibold text-[15px] -tracking-[0.01em] text-ink whitespace-nowrap text-right"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        USD {lead.valor_cerrado.toLocaleString("es-AR")}
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
