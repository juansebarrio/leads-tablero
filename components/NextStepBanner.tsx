import { Clock } from "lucide-react";
import { formatDuracion, formatHora } from "@/lib/format";
import type { EventoAgenda, LeadDetalle } from "@/lib/types";

interface NextStepBannerProps {
  lead: LeadDetalle;
}

// Devuelve null si el lead no tiene próximo paso definido.
export function NextStepBanner({ lead }: NextStepBannerProps) {
  if (!lead.proximo_paso) return null;

  // Buscamos un evento de agenda hoy/futuro que matchee el próximo paso
  // (por proximidad de fecha). Si existe, mostramos hora + duración y CTA.
  const eventoRelacionado = matchEvento(lead);

  return (
    <div className="bg-violeta-soft border border-[#D6CAFF] rounded-lg p-4 md:px-[18px] mb-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-3.5">
      <div className="w-9 h-9 rounded-full bg-violeta text-white flex items-center justify-center shrink-0">
        <Clock className="w-[18px] h-[18px]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] text-violeta font-bold tracking-[0.06em] uppercase mb-0.5">
          Lo siguiente
        </div>
        <div className="text-[13.5px] text-ink font-medium leading-snug">
          <strong className="font-semibold">{lead.proximo_paso}</strong>
          {eventoRelacionado && (
            <>
              {" "}
              hoy a las {formatHora(eventoRelacionado.fecha)} ·{" "}
              {formatDuracion(eventoRelacionado.duracion_min)}
            </>
          )}
        </div>
      </div>
      {eventoRelacionado && (
        <a className="md:self-auto self-end text-violeta font-semibold text-[12.5px] border-b border-violeta pb-px cursor-pointer whitespace-nowrap">
          Abrir reunión →
        </a>
      )}
    </div>
  );
}

function matchEvento(lead: LeadDetalle): EventoAgenda | null {
  if (!lead.proximo_paso_fecha) return null;
  const fechaPaso = new Date(lead.proximo_paso_fecha).getTime();
  // Buscamos el evento de hoy más cercano al proximo_paso_fecha (±2h).
  const dosHoras = 2 * 60 * 60 * 1000;
  const candidatos = lead.agendaRelacionada
    .map((e) => ({ e, diff: Math.abs(new Date(e.fecha).getTime() - fechaPaso) }))
    .filter((c) => c.diff <= dosHoras)
    .sort((a, b) => a.diff - b.diff);
  return candidatos[0]?.e ?? null;
}
