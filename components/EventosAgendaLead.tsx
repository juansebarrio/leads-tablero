import { formatDuracion, formatHora } from "@/lib/format";
import { formatFechaCorta } from "@/lib/lead-utils";
import type { EventoAgenda, Modalidad } from "@/lib/types";

interface EventosAgendaLeadProps {
  eventos: EventoAgenda[];
}

const MODALIDAD_LABEL: Record<Modalidad, string> = {
  meet: "Google Meet",
  zoom: "Zoom",
  whatsapp: "WhatsApp",
  presencial: "Presencial",
};

export function EventosAgendaLead({ eventos }: EventosAgendaLeadProps) {
  if (eventos.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-lg px-5 py-6 text-[13px] text-muted">
        Sin eventos agendados con este lead.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
      {eventos.map((e) => (
        <div
          key={e.id}
          className="bg-panel border border-line rounded-lg p-3.5 px-4 flex gap-3.5 items-center"
        >
          <div className="shrink-0 min-w-[60px]">
            <div className="font-display font-semibold text-base text-ink leading-none -tracking-[0.01em]">
              {formatHora(e.fecha)}
            </div>
            <div className="text-[10.5px] text-muted mt-1">
              {formatFechaCorta(e.fecha)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-ink text-[13px] mb-0.5 truncate">
              {e.titulo}
            </div>
            <div className="text-[11.5px] text-muted">
              {MODALIDAD_LABEL[e.modalidad]}
              <span className="inline-block align-middle w-[3px] h-[3px] rounded-full bg-muted-2 mx-1.5" />
              {formatDuracion(e.duracion_min)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
