"use client";

import { useEffect, useState } from "react";
import { useDrawers } from "@/components/drawer-context";
import { formatDuracion, formatHora } from "@/lib/format";
import type { AgendaTag, EventoAgenda } from "@/lib/types";

interface AgendaPanelProps {
  events: EventoAgenda[];
  // Stats opcionales que se muestran al pie. Por ahora hardcodeadas en parent.
  cierreMes?: {
    valor: number;
    porcentaje: number;
    diasRestantes: number;
    meta: number;
  };
}

const TAG_STYLE: Record<AgendaTag, { bg: string; color: string }> = {
  cierre_semana: { bg: "bg-rojo-soft", color: "text-rojo" },
  referido: { bg: "bg-violeta-soft", color: "text-violeta" },
  propuesta: { bg: "bg-violeta-soft", color: "text-violeta" },
  definitiva: { bg: "bg-rojo-soft", color: "text-rojo" },
};

const TAG_LABEL: Record<AgendaTag, string> = {
  cierre_semana: "Cierre semana",
  referido: "Referido",
  propuesta: "Propuesta",
  definitiva: "Definitiva",
};

export function AgendaPanel({ events, cierreMes }: AgendaPanelProps) {
  const { agendaOpen } = useDrawers();
  const ahora = useNow();

  // El evento "now" es el primero que aún no terminó hoy.
  const idxAhora = events.findIndex(
    (e) =>
      new Date(e.fecha).getTime() + e.duracion_min * 60_000 >= ahora.getTime(),
  );

  const fechaHumano = ahora.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });

  return (
    <aside
      className={`
        bg-panel border-l border-line p-[22px] pt-7 overflow-y-auto
        fixed top-0 right-0 w-[320px] max-w-[90vw] h-screen z-70
        transition-transform duration-250 ease-in-out
        ${agendaOpen ? "translate-x-0" : "translate-x-full"}
        xl:static xl:translate-x-0 xl:w-[280px] xl:h-screen xl:sticky xl:top-0
        xl:shadow-none shadow-[-8px_0_32px_rgba(14,14,18,0.08)]
        max-md:w-full max-md:max-w-[360px]
      `}
      style={{ zIndex: 70 }}
    >
      <div
        className="font-display font-medium text-lg -tracking-[0.015em] mb-1"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        Tu día
      </div>
      <div className="text-[11.5px] text-muted mb-4">
        {events.length} {events.length === 1 ? "reunión" : "reuniones"} ·{" "}
        {fechaHumano}
      </div>
      <div className="bg-ink text-white text-[10px] px-2 py-0.5 rounded-full tracking-[0.06em] uppercase font-semibold inline-block mb-3">
        ● Ahora · {formatHora(ahora.toISOString())}
      </div>

      <div>
        {events.length === 0 && (
          <div className="text-[12px] text-muted py-4">
            Sin reuniones agendadas hoy.
          </div>
        )}
        {events.map((e, i) => (
          <EventRow key={e.id} event={e} isNow={i === idxAhora} />
        ))}
      </div>

      {cierreMes && (
        <div className="mt-5 p-4 bg-bg rounded-lg border border-line">
          <div className="text-[10.5px] text-muted tracking-[0.06em] uppercase font-semibold mb-1.5">
            Cierre del mes
          </div>
          <div className="font-display font-semibold text-[22px] -tracking-[0.02em] leading-none text-ink mb-1.5">
            USD {(cierreMes.valor / 1000).toFixed(0)}k{" "}
            <em className="italic text-violeta">· {cierreMes.porcentaje}%</em>
          </div>
          <div className="text-[11px] text-muted leading-snug">
            Faltan{" "}
            <strong className="text-ink-2 font-semibold">
              {cierreMes.diasRestantes} días
            </strong>
            . Meta: USD {(cierreMes.meta / 1000).toFixed(0)}k.
          </div>
        </div>
      )}
    </aside>
  );
}

function EventRow({ event, isNow }: { event: EventoAgenda; isNow: boolean }) {
  const tagStyle = event.tag ? TAG_STYLE[event.tag] : null;
  const tagLabel = event.tag ? TAG_LABEL[event.tag] : null;
  const modalidadLabel = labelModalidad(event.modalidad);

  return (
    <div
      className={`
        relative py-3 pl-[52px] border-b border-line-2 last:border-b-0
        ${isNow ? "-ml-2.5 pl-[62px]" : ""}
      `}
    >
      {isNow && (
        <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-violeta rounded-r-sm" />
      )}
      <div
        className={`absolute top-3 font-display font-semibold text-[13.5px] -tracking-[0.01em] text-ink ${
          isNow ? "left-2.5" : "left-0"
        }`}
      >
        {formatHora(event.fecha)}
      </div>
      <div
        className={`absolute top-[30px] text-[10px] text-muted font-medium ${
          isNow ? "left-2.5" : "left-0"
        }`}
      >
        {formatDuracion(event.duracion_min)}
      </div>
      <div className="text-[12.5px] font-semibold text-ink leading-tight">
        {event.titulo}
      </div>
      <div className="text-[11px] text-muted mt-0.5 mb-1.5">
        {modalidadLabel}
      </div>
      {tagLabel && tagStyle && (
        <span
          className={`inline-flex items-center text-[10px] font-bold tracking-[0.04em] uppercase ${tagStyle.bg} ${tagStyle.color} px-1.5 py-0.5 rounded-full`}
        >
          {tagLabel}
        </span>
      )}
    </div>
  );
}

function labelModalidad(m: EventoAgenda["modalidad"]): string {
  switch (m) {
    case "meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "whatsapp":
      return "WhatsApp";
    case "presencial":
      return "Presencial";
  }
}

// Hook minimalista: actualiza la hora cada minuto para que "Ahora" no quede
// congelado si la pestaña queda abierta.
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}
