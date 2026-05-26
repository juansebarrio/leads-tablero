"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cambiarEstado } from "@/app/actions/leads";
import {
  AnimatedCounter,
  formatInt,
  formatUSDCounter,
} from "@/components/pipeline/AnimatedCounter";
import {
  ComercialFilter,
  type FiltroComercial,
} from "@/components/pipeline/ComercialFilter";
import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { KanbanColumn } from "@/components/pipeline/KanbanColumn";
import type { Comercial, Estado, LeadKanban } from "@/lib/types";

interface PipelineBoardProps {
  initialLeads: LeadKanban[];
  comerciales: Comercial[];
  // Si viene un id de comercial, arranca con ese filtro preseleccionado
  // (útil para drill-down desde /equipo).
  initialComercialId?: string | null;
}

const ORDEN: { estado: Estado; nombre: string; sub: string }[] = [
  { estado: "nuevo", nombre: "Nuevos", sub: "Ingresan hace menos de 7 días" },
  {
    estado: "conversacion",
    nombre: "En conversación",
    sub: "Primer contacto hecho",
  },
  { estado: "propuesta", nombre: "Propuesta", sub: "Cotización enviada" },
  { estado: "cierre", nombre: "Cierre", sub: "Esperando definición" },
  { estado: "ganado", nombre: "Ganados", sub: "Cerrados este mes" },
];

export function PipelineBoard({
  initialLeads,
  comerciales,
  initialComercialId,
}: PipelineBoardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroComercial>(() =>
    initialComercialId
      ? { tipo: "comercial", id: initialComercialId }
      : { tipo: "todos" },
  );
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  // Filtro aplicado.
  const visibleLeads = useMemo(() => {
    if (filtro.tipo === "todos") return leads;
    if (filtro.tipo === "sin_asignar") {
      return leads.filter((l) => !l.responsable_id);
    }
    return leads.filter((l) => l.responsable_id === filtro.id);
  }, [leads, filtro]);

  const leadsPorEstado = useMemo(() => {
    const map = new Map<Estado, LeadKanban[]>();
    for (const o of ORDEN) map.set(o.estado, []);
    for (const l of visibleLeads) {
      map.get(l.estado)?.push(l);
    }
    return map;
  }, [visibleLeads]);

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  const totalActivo = visibleLeads
    .filter((l) => l.estado !== "ganado")
    .reduce((acc, l) => acc + l.valor_estimado, 0);
  const totalLeadsCount = visibleLeads.length;

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    setErrorMsg(null);
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const draggedId = String(active.id);
    const dragged = leads.find((l) => l.id === draggedId);
    if (!dragged) return;

    // El destino puede ser una columna (`col-<estado>`) o una card.
    let destinoEstado: Estado | null = null;
    const overId = String(over.id);
    if (overId.startsWith("col-")) {
      destinoEstado = overId.slice(4) as Estado;
    } else {
      const overData = over.data.current as { estado?: Estado } | undefined;
      destinoEstado = overData?.estado ?? null;
    }
    if (!destinoEstado) return;
    if (destinoEstado === dragged.estado) return;

    const fromEstado = dragged.estado;

    // Optimistic UI: actualizamos local y arrancamos el server action.
    setLeads((prev) =>
      prev.map((l) =>
        l.id === draggedId
          ? { ...l, estado: destinoEstado as Estado, dias_en_estado: 0 }
          : l,
      ),
    );

    startTransition(async () => {
      const res = await cambiarEstado({
        leadId: draggedId,
        from: fromEstado,
        to: destinoEstado as string,
      });
      if (!res.ok) {
        // Rollback.
        setLeads((prev) =>
          prev.map((l) =>
            l.id === draggedId ? { ...l, estado: fromEstado } : l,
          ),
        );
        setErrorMsg(
          `No pudimos mover "${dragged.nombre}": ${res.error}`,
        );
        return;
      }
      // Refresca el chrome (sidebar counts, etc.) sin perder estado local.
      router.refresh();
    });
  }

  return (
    <>
      {/* Header de página */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 lg:gap-6 mb-7 lg:px-0 px-4 md:px-6">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
            Pipeline ·{" "}
            {new Date().toLocaleDateString("es-AR", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <h1
            className="font-display text-[24px] md:text-[30px] xl:text-[36px] font-medium leading-[1.05] -tracking-[0.025em] text-ink mb-2.5"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Todo lo que está{" "}
            <em className="italic text-violeta font-medium">en juego</em>.
          </h1>
          <div className="text-[12.5px] md:text-[13.5px] text-muted flex flex-col md:flex-row md:items-baseline gap-1 md:gap-0">
            <span>
              <strong className="text-ink font-semibold">
                <AnimatedCounter
                  value={totalActivo}
                  format={formatUSDCounter}
                />
              </strong>{" "}
              en oportunidades activas
            </span>
            <span className="hidden md:inline mx-2 text-muted-2">·</span>
            <span>
              <strong className="text-ink font-semibold">
                <AnimatedCounter value={totalLeadsCount} format={formatInt} />{" "}
                leads
              </strong>{" "}
              distribuidos
            </span>
            <span className="hidden md:inline mx-2 text-muted-2">·</span>
            <span>
              ritmo del mes{" "}
              <strong className="text-ink font-semibold">+12%</strong>
            </span>
          </div>
        </div>

        <ComercialFilter
          comerciales={comerciales}
          totalLeads={totalLeadsCount}
          filtro={filtro}
          onChange={setFiltro}
        />
      </div>

      {errorMsg && (
        <div className="mb-3 mx-4 md:mx-6 lg:mx-0 bg-rojo-soft border border-rojo/20 text-rojo text-[12.5px] rounded-md px-3 py-2">
          {errorMsg}
        </div>
      )}

      {/* Board: scroll horizontal en tablet/mobile, grid en desktop XL */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="
            flex lg:grid xl:grid-cols-5 lg:grid-cols-5
            gap-3 xl:gap-3.5
            overflow-x-auto lg:overflow-visible
            px-4 md:px-6 lg:px-0
            pb-8
            snap-x snap-mandatory lg:snap-none
          "
        >
          {ORDEN.map(({ estado, nombre, sub }) => (
            <div key={estado} className="snap-start min-w-0">
              <KanbanColumn
                estado={estado}
                nombre={nombre}
                sub={sub}
                leads={leadsPorEstado.get(estado) ?? []}
              />
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? <KanbanCard lead={activeLead} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}
