"use client";

import {
  CheckCircle2,
  MoreVertical,
  PencilLine,
  RotateCcw,
  Trophy,
  UserCog,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { cambiarEstado, reabrirLead } from "@/app/actions/leads";
import { DropdownMenu, type DropdownItem } from "@/components/DropdownMenu";
import { useDrawers, type LeadActionData } from "@/components/drawer-context";
import { RegistrarContactoTrigger } from "@/components/RegistrarContactoLauncher";
import { estadoSiguiente } from "@/lib/lead-utils";
import type { Estado } from "@/lib/types";

interface LeadActionsProps {
  leadId: string;
  leadNombre: string;
  estadoActual: Estado;
  // Datos del lead para precargar los drawers sin ir de vuelta al server.
  origen: string | null;
  origen_detalle: string | null;
  valor_estimado: number | null;
  tipo_negocio: string | null;
  meses_compromiso: number | null;
  proximo_paso: string | null;
  proximo_paso_fecha: string | null;
  responsable_id: string | null;
  responsable_nombre: string | null;
}

export function LeadActions({
  leadId,
  leadNombre,
  estadoActual,
  origen,
  origen_detalle,
  valor_estimado,
  tipo_negocio,
  meses_compromiso,
  proximo_paso,
  proximo_paso_fecha,
  responsable_id,
  responsable_nombre,
}: LeadActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    openEditarLead,
    openReasignar,
    openMarcarPerdido,
    openConfirmarGanado,
  } = useDrawers();

  const isTerminal = estadoActual === "ganado" || estadoActual === "perdido";
  const siguiente = isTerminal ? null : estadoSiguiente(estadoActual);

  // Snapshot común que pasamos al context.
  const snapshot: LeadActionData = {
    leadId,
    leadNombre,
    estadoActual,
    origen,
    origen_detalle,
    valor_estimado,
    tipo_negocio,
    meses_compromiso,
    proximo_paso,
    proximo_paso_fecha,
    responsable_id,
    responsable_nombre,
  };

  // Mover al estado siguiente — directo si no es ganado. Si es ganado, abre
  // el drawer de confirmación.
  const onMover = () => {
    if (!siguiente) return;
    if (siguiente.estado === "ganado") {
      openConfirmarGanado(snapshot);
      return;
    }
    startTransition(async () => {
      const res = await cambiarEstado({
        leadId,
        from: estadoActual,
        to: siguiente.estado,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Lead movido a ${siguiente.label.toLowerCase()}`);
      router.refresh();
    });
  };

  const onReabrir = () => {
    startTransition(async () => {
      const res = await reabrirLead({ leadId, estadoActual });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Lead reabierto en conversación");
      router.refresh();
    });
  };

  // Construcción del menú según el estado.
  const items: DropdownItem[] = isTerminal
    ? [
        {
          label: "Reabrir lead",
          icon: RotateCcw,
          onSelect: onReabrir,
        },
      ]
    : [
        {
          label: "Editar lead",
          icon: PencilLine,
          onSelect: () => openEditarLead(snapshot),
        },
        {
          label: "Reasignar responsable",
          icon: UserCog,
          onSelect: () => openReasignar(snapshot),
        },
        ...(estadoActual === "cierre"
          ? ([
              {
                label: "Confirmar como ganado",
                icon: Trophy,
                onSelect: () => openConfirmarGanado(snapshot),
                variant: "success",
              },
            ] as DropdownItem[])
          : []),
        { type: "separator" },
        {
          label: "Marcar como perdido",
          icon: XCircle,
          onSelect: () => openMarcarPerdido(snapshot),
          variant: "danger",
        },
      ];

  return (
    <div className="flex items-center gap-2 shrink-0">
      <RegistrarContactoTrigger leadId={leadId} leadNombre={leadNombre} />

      {/* Mover al siguiente — oculto en mobile y cuando el siguiente
          requiere drawer (cierre → ganado) o el lead es terminal. */}
      {siguiente && siguiente.estado !== "ganado" && (
        <button
          type="button"
          onClick={onMover}
          disabled={pending}
          className="hidden md:inline-flex items-center gap-1.5 bg-panel border border-line text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] cursor-pointer hover:border-ink-2 transition whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
        >
          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          Mover a {siguiente.label.toLowerCase()}
        </button>
      )}

      {/* Editar — desktop only, también en el menú "..." */}
      {!isTerminal && (
        <button
          type="button"
          onClick={() => openEditarLead(snapshot)}
          className="hidden md:inline-flex items-center gap-1.5 bg-panel border border-line text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] cursor-pointer hover:border-ink-2 transition whitespace-nowrap"
        >
          <PencilLine className="w-3.5 h-3.5" strokeWidth={2} />
          Editar
        </button>
      )}

      <DropdownMenu
        items={items}
        trigger={({ open, onClick, ref }) => (
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            aria-label="Más opciones"
            aria-expanded={open}
            className={`w-[38px] h-[38px] inline-flex items-center justify-center bg-panel border rounded-md cursor-pointer transition ${
              open
                ? "border-ink-2 text-ink"
                : "border-line text-ink-2 hover:border-ink-2"
            }`}
          >
            <MoreVertical className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      />
    </div>
  );
}
