import Link from "next/link";
import { TimelineProgress } from "@/components/TimelineProgress";
import { formatUSD } from "@/lib/format";
import type { LeadFrio, Origen, TipoNegocio } from "@/lib/types";

interface LeadsTableProps {
  leads: LeadFrio[];
  maxFilas?: number;
}

const ORIGEN_LABEL: Record<Origen, string> = {
  formulario: "Formulario",
  referido: "Referido",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

const TIPO_LABEL: Record<TipoNegocio, string> = {
  recurrente: "Recurrente",
  proyecto: "Proyecto",
};

export function LeadsTable({ leads, maxFilas = 5 }: LeadsTableProps) {
  const filas = leads.slice(0, maxFilas);

  return (
    <div className="bg-panel rounded-lg border border-line overflow-hidden">
      {/* Desktop / tablet: tabla densa */}
      <div className="hidden md:block">
        <table className="w-full text-[12.5px]" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "24%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>
          <thead>
            <tr className="bg-panel-2">
              <th className="text-left px-4 py-2.5 font-semibold text-muted text-[10.5px] tracking-[0.06em] uppercase border-b border-line">
                Lead
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-muted text-[10.5px] tracking-[0.06em] uppercase border-b border-line">
                Ritmo de contacto
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-muted text-[10.5px] tracking-[0.06em] uppercase border-b border-line">
                Valor
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-muted text-[10.5px] tracking-[0.06em] uppercase border-b border-line">
                Responsable
              </th>
              <th className="border-b border-line" />
            </tr>
          </thead>
          <tbody>
            {filas.map((l, i) => (
              <tr
                key={l.id}
                className={`hover:bg-panel-2 ${
                  i < filas.length - 1 ? "border-b border-line-2" : ""
                }`}
              >
                <td className="px-4 py-3.5 align-middle">
                  <div className="font-semibold text-ink text-[13px] leading-tight truncate">
                    {l.nombre}
                  </div>
                  <div className="text-[11.5px] text-muted flex items-center gap-1.5 mt-0.5">
                    <span className="bg-line-2 text-ink-2 px-1.5 py-px rounded-full text-[10.5px] font-medium">
                      {ORIGEN_LABEL[l.origen]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <TimelineProgress diasFrio={l.dias_frio} />
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <div className="font-display font-semibold text-sm text-ink -tracking-[0.01em] leading-none whitespace-nowrap">
                    {formatUSD(l.valor_estimado)}
                  </div>
                  <div className="text-[11px] text-muted font-normal mt-1 truncate">
                    {TIPO_LABEL[l.tipo_negocio]}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-middle">
                  <OwnerCell lead={l} />
                </td>
                <td className="px-4 py-3.5 align-middle text-right">
                  <Link
                    href={`/lead/${l.id}`}
                    className="inline-block bg-ink text-white border border-ink px-3 py-1.5 rounded-md text-[12px] font-medium hover:bg-violeta hover:border-violeta transition cursor-pointer"
                  >
                    {l.responsable_id ? "Retomar" : "Asignar"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden flex flex-col gap-3 bg-bg p-0">
        {filas.map((l) => (
          <div
            key={l.id}
            className="bg-panel border border-line rounded-lg p-4 grid gap-3.5"
            style={{
              gridTemplateColumns: "1fr auto",
              gridTemplateAreas: `"name name" "ritmo ritmo" "valor responsable" "action action"`,
            }}
          >
            <div style={{ gridArea: "name" }}>
              <div className="font-semibold text-ink text-sm leading-tight">
                {l.nombre}
              </div>
              <div className="text-[11.5px] text-muted flex items-center gap-1.5 mt-1.5">
                <span className="bg-line-2 text-ink-2 px-1.5 py-px rounded-full text-[10.5px] font-medium">
                  {ORIGEN_LABEL[l.origen]}
                </span>
              </div>
            </div>
            <div style={{ gridArea: "ritmo" }}>
              <TimelineProgress diasFrio={l.dias_frio} />
            </div>
            <div style={{ gridArea: "valor" }} className="self-center">
              <div className="font-display font-semibold text-sm text-ink -tracking-[0.01em] leading-none">
                {formatUSD(l.valor_estimado)}
              </div>
              <div className="text-[11px] text-muted mt-1">
                {TIPO_LABEL[l.tipo_negocio]}
              </div>
            </div>
            <div
              style={{ gridArea: "responsable" }}
              className="self-center text-right"
            >
              <OwnerCell lead={l} alignEnd />
            </div>
            <Link
              href={`/lead/${l.id}`}
              style={{ gridArea: "action" }}
              className="block text-center w-full bg-ink text-white border border-ink py-2.5 rounded-md text-[13px] font-medium hover:bg-violeta hover:border-violeta transition cursor-pointer"
            >
              {l.responsable_id ? "Retomar" : "Asignar"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function OwnerCell({
  lead,
  alignEnd = false,
}: {
  lead: LeadFrio;
  alignEnd?: boolean;
}) {
  const sinAsignar = !lead.responsable_id;
  return (
    <div
      className={`flex items-center gap-2 text-[12.5px] text-ink-2 whitespace-nowrap ${
        alignEnd ? "justify-end" : ""
      }`}
    >
      {sinAsignar ? (
        <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold text-muted bg-line border border-dashed border-muted-2">
          ?
        </div>
      ) : (
        <div
          className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
          style={{ background: lead.comercial_avatar ?? "" }}
        >
          {lead.comercial_iniciales}
        </div>
      )}
      <span>
        {sinAsignar
          ? "Sin asignar"
          : (lead.comercial_nombre?.split(" ")[0] ?? "—")}
      </span>
    </div>
  );
}
