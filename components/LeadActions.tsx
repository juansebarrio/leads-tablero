"use client";

import { CheckCircle2, MoreVertical, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { AgendaTrigger } from "@/components/AgendaTrigger";
import { RegistrarContactoLauncher } from "@/components/RegistrarContactoLauncher";
import { estadoSiguiente } from "@/lib/lead-utils";
import type { Estado } from "@/lib/types";

interface LeadActionsProps {
  leadId: string;
  leadNombre: string;
  estadoActual: Estado;
  agendaCount: number;
}

export function LeadActions({
  leadId,
  leadNombre,
  estadoActual,
  agendaCount,
}: LeadActionsProps) {
  const siguiente = estadoSiguiente(estadoActual);

  // Demo: las acciones que aún no tienen drawer real disparan toast.
  const onMover = () =>
    toast(`Mover a ${siguiente?.label.toLowerCase() ?? "siguiente estado"}`, {
      description:
        "En la versión real, esto cambia el estado del lead y registra el movimiento en el historial.",
    });
  const onEditar = () =>
    toast("Editar lead", {
      description: "El drawer de edición se conecta en la próxima iteración.",
    });
  const onMas = () =>
    toast("Más opciones", {
      description: "Duplicar, archivar, copiar link y exportar.",
    });

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* "Tu día" — solo visible Desktop (1024–1279) */}
      <AgendaTrigger count={agendaCount} />

      {/* Primary: Registrar contacto — abre el drawer */}
      <RegistrarContactoLauncher leadId={leadId} leadNombre={leadNombre} />

      {/* Mover + Editar — ocultos en mobile */}
      {siguiente && (
        <button
          type="button"
          onClick={onMover}
          className="hidden md:inline-flex items-center gap-1.5 bg-panel border border-line text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] cursor-pointer hover:border-ink-2 transition whitespace-nowrap"
        >
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          Mover a {siguiente.label.toLowerCase()}
        </button>
      )}
      <button
        type="button"
        onClick={onEditar}
        className="hidden md:inline-flex items-center gap-1.5 bg-panel border border-line text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] cursor-pointer hover:border-ink-2 transition whitespace-nowrap"
      >
        <PencilLine className="w-3.5 h-3.5" strokeWidth={2} />
        Editar
      </button>

      {/* Menú "…" — siempre visible (en mobile contiene los ocultos) */}
      <button
        type="button"
        onClick={onMas}
        aria-label="Más opciones"
        className="w-[38px] h-[38px] inline-flex items-center justify-center bg-panel border border-line text-ink-2 rounded-md cursor-pointer hover:border-ink-2 transition"
      >
        <MoreVertical className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}
