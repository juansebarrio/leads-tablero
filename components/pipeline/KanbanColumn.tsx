"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import { ColumnHeader } from "@/components/pipeline/ColumnHeader";
import { KanbanCard } from "@/components/pipeline/KanbanCard";
import { StuckHint } from "@/components/pipeline/StuckHint";
import type { Estado, LeadKanban } from "@/lib/types";

interface KanbanColumnProps {
  estado: Estado;
  nombre: string;
  sub: string;
  leads: LeadKanban[];
}

export function KanbanColumn({ estado, nombre, sub, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${estado}`,
    data: { estado },
  });

  const cantidad = leads.length;
  const valorTotal = leads.reduce((acc, l) => acc + l.valor_estimado, 0);
  const stuckCount = leads.filter((l) => l.dias_en_estado > 14).length;
  const isGanado = estado === "ganado";

  return (
    <div
      className={`
        rounded-[10px] border flex flex-col min-w-0 transition-colors
        ${isGanado
          ? "bg-[linear-gradient(180deg,#F2F8F4_0%,#E6F1EB_100%)] border-[#C9E2D2] shadow-[0_0_0_1px_rgba(62,138,90,0.08),0_4px_24px_rgba(62,138,90,0.06)]"
          : "bg-panel-2 border-line"}
        ${isOver ? "ring-2 ring-violeta ring-offset-2 ring-offset-bg" : ""}
        flex-shrink-0 w-[260px] md:w-[300px] xl:w-auto
        lg:h-full lg:max-h-full
      `}
    >
      <ColumnHeader
        estado={estado}
        nombre={nombre}
        cantidad={cantidad}
        valorTotal={valorTotal}
        sub={sub}
      />

      {stuckCount >= 2 && <StuckHint count={stuckCount} />}

      <div
        ref={setNodeRef}
        className="p-3 flex flex-col gap-2.5 flex-1 overflow-y-auto min-h-[200px]"
      >
        <SortableContext
          items={leads.map((l) => l.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* mode="popLayout" hace que las cards restantes se reacomoden con
              stagger natural mientras la card removida sale, en lugar de
              "saltar" inmediato. */}
          <AnimatePresence initial={false} mode="popLayout">
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} />
            ))}
          </AnimatePresence>
        </SortableContext>

        {leads.length === 0 && (
          <div className="border-[1.5px] border-dashed border-line rounded-lg px-3.5 py-6 text-center text-muted-2 text-[11.5px]">
            Soltá una card acá
          </div>
        )}
      </div>
    </div>
  );
}
