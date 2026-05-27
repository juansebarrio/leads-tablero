"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { WonCheckmark } from "@/components/pipeline/WonCheckmark";
import { formatUSDCorto } from "@/lib/format";
import { formatFechaCorta } from "@/lib/lead-utils";
import type {
  LeadKanban,
  Origen,
  Temperatura,
  TipoNegocio,
} from "@/lib/types";

interface KanbanCardProps {
  lead: LeadKanban;
  // Si está en este overlay (DragOverlay), aplicamos look "dragging".
  overlay?: boolean;
}

const ORIGEN_LABEL: Record<Origen, string> = {
  formulario: "Formulario",
  referido: "Referido",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

const HEAT_DOT: Record<Temperatura, string> = {
  hot: "bg-rojo",
  warm: "bg-amarillo",
  med: "bg-violeta",
  cool: "bg-turquesa",
};

const TIPO_LABEL: Record<TipoNegocio, string> = {
  recurrente: "Recurrente",
  proyecto: "Proyecto",
};

// Card del kanban. Sortable (drag entre columnas + dentro) con animaciones.
// Click en cualquier zona de la card → navega al detalle. El drag se activa
// solo después de 6px de movimiento (PointerSensor activationConstraint),
// así click puro no triggea drag y vice versa.
export function KanbanCard({ lead, overlay = false }: KanbanCardProps) {
  const router = useRouter();
  const sortable = useSortable({
    id: lead.id,
    data: { estado: lead.estado },
  });
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = sortable;

  // Cuando la card está siendo arrastrada y aparece en el overlay, la del
  // árbol original queda como placeholder semi-transparente.
  const isPlaceholder = isDragging && !overlay;
  const isGanado = lead.estado === "ganado";
  const isStuck = lead.dias_en_estado > 14;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      layout
      layoutId={overlay ? undefined : `card-${lead.id}`}
      // Spring suave en mounts + reposicionamiento entre columnas.
      // El layoutId hace que la card "vuele" en lugar de aparecer abrupto.
      initial={{ scale: 0.95, opacity: 0.85 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role={overlay ? undefined : "link"}
      tabIndex={overlay ? undefined : 0}
      aria-label={overlay ? undefined : `Abrir ${lead.nombre}`}
      onClick={overlay ? undefined : () => router.push(`/lead/${lead.id}`)}
      onKeyDown={
        overlay
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/lead/${lead.id}`);
              }
            }
      }
      className={`
        relative bg-panel border rounded-lg p-3.5 flex flex-col gap-2.5 cursor-grab active:cursor-grabbing
        ${isGanado
          ? "border-[#C9E2D2] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FCFA_100%)] shadow-[0_0_0_1px_rgba(62,138,90,0.04),0_2px_8px_rgba(62,138,90,0.06)]"
          : "border-line"}
        ${overlay
          ? "shadow-[0_20px_50px_rgba(14,14,18,0.18),0_4px_12px_rgba(14,14,18,0.08)] !border-violeta"
          : ""}
        ${isPlaceholder ? "opacity-30" : ""}
        ${!overlay && !isPlaceholder ? "hover:-translate-y-0.5 hover:border-ink-2 hover:shadow-[0_8px_24px_rgba(14,14,18,0.06),0_2px_6px_rgba(14,14,18,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violeta focus-visible:ring-offset-2 focus-visible:ring-offset-bg" : ""}
        transition-[transform,box-shadow,border-color] duration-150 ease-out
      `}
    >
      {isGanado && <WonCheckmark />}

      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="min-w-0 flex-1">
          <div
            title={lead.nombre}
            className="font-display font-medium text-[14.5px] leading-[1.2] -tracking-[0.01em] text-ink mb-1 truncate"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {lead.nombre}
          </div>
          <div className="flex items-center gap-1.5 text-[10.5px] text-muted">
            <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${HEAT_DOT[lead.temperatura]}`} />
            <span className="bg-line-2 text-ink-2 px-1.5 py-px rounded-full text-[10px] font-medium">
              {ORIGEN_LABEL[lead.origen]}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div
          className="font-display font-semibold text-[16px] xl:text-[18px] -tracking-[0.015em] text-ink leading-none"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          {lead.valor_estimado > 0
            ? `USD ${formatUSDCorto(lead.valor_estimado).replace("k", ".000").replace(/\.000$/, lead.valor_estimado >= 1000 ? "" : "")}`
            : "—"}
        </div>
        <div className="text-[11px] text-muted mt-0.5">
          {TIPO_LABEL[lead.tipo_negocio]}
          {lead.tipo_negocio === "recurrente" && lead.meses_compromiso && (
            <span> · {lead.meses_compromiso} m</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-line-2 text-[11.5px] text-ink-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {lead.comercial_iniciales ? (
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
              style={{ background: lead.comercial_avatar ?? "" }}
            >
              {lead.comercial_iniciales}
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-muted text-[9px] font-bold shrink-0 bg-line border border-dashed border-muted-2">
              ?
            </span>
          )}
          <span className="truncate">
            {lead.comercial_nombre?.split(" ")[0] ?? "Sin asignar"}
          </span>
        </span>
        <span
          className={`shrink-0 flex items-center gap-1 text-[10.5px] ${isStuck ? "text-amarillo font-semibold" : "text-muted"}`}
        >
          <span
            className={`w-1 h-1 rounded-full ${isStuck ? "bg-amarillo" : "bg-muted-2"}`}
          />
          {labelTiempo(lead)}
        </span>
      </div>
    </motion.div>
  );
}

function labelTiempo(lead: LeadKanban): string {
  if (lead.estado === "ganado") {
    return `ganado el ${formatFechaCorta(lead.fecha_creacion)}`;
  }
  return `${lead.dias_en_estado}d acá`;
}
