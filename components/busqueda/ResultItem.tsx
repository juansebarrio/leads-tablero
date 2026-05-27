"use client";

import { ArrowRight, type LucideIcon } from "lucide-react";
import type { Estado } from "@/lib/types";

// Item del command palette. Genérico: lo usan leads, acciones, páginas, notas.
//
// Variantes visuales:
//  - icon "lead" (turquesa): leads
//  - icon "action" (violeta): acciones rápidas
//  - icon "page" (azul): navegación
//  - icon "note" (amarillo): contactos / notas
//  - icon "person" (gradient): comercial — usa avatar_gradient inline

export type ResultIconKind = "lead" | "action" | "page" | "note" | "person";

interface Props {
  icon: LucideIcon | null;
  iconKind: ResultIconKind;
  avatarGradient?: string;
  iniciales?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  estadoTag?: Estado | null;
  shortcut?: string[];
  showArrow?: boolean;
  selected: boolean;
  onMouseEnter: () => void;
  onClick: () => void;
}

const ICON_KIND_CLASS: Record<
  ResultIconKind,
  { bg: string; border: string; text: string }
> = {
  lead: {
    bg: "bg-turquesa-soft",
    border: "border-[#BBE3EE]",
    text: "text-turquesa",
  },
  action: {
    bg: "bg-violeta-soft",
    border: "border-[#D6CAFF]",
    text: "text-violeta",
  },
  page: {
    bg: "bg-azul-soft",
    border: "border-[#C9D5FF]",
    text: "text-azul",
  },
  note: {
    bg: "bg-amarillo-soft",
    border: "border-[#EBD9A1]",
    text: "text-amarillo",
  },
  person: {
    bg: "",
    border: "border-transparent",
    text: "text-white",
  },
};

const ESTADO_TAG_CLASS: Record<Estado, string> = {
  nuevo: "bg-azul-soft text-azul",
  conversacion: "bg-violeta-soft text-violeta",
  propuesta: "bg-[#F1ECFF] text-violeta",
  cierre: "bg-coral text-white",
  ganado: "bg-verde-soft text-verde",
  perdido: "bg-rojo-soft text-rojo",
};

const ESTADO_TAG_LABEL: Record<Estado, string> = {
  nuevo: "Nuevo",
  conversacion: "Conversación",
  propuesta: "Propuesta",
  cierre: "Cierre",
  ganado: "Ganado",
  perdido: "Perdido",
};

export function ResultItem({
  icon: Icon,
  iconKind,
  avatarGradient,
  iniciales,
  title,
  meta,
  estadoTag,
  shortcut,
  showArrow,
  selected,
  onMouseEnter,
  onClick,
}: Props) {
  const iconStyle = ICON_KIND_CLASS[iconKind];
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      data-selected={selected}
      className={`w-full px-[18px] py-2.5 grid grid-cols-[28px_1fr_auto] gap-3 items-center text-left cursor-pointer border-l-2 transition ${
        selected
          ? "bg-violeta-soft border-l-violeta"
          : "border-l-transparent hover:bg-panel-2"
      }`}
    >
      {iconKind === "person" ? (
        <span
          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white text-[10.5px] font-bold shrink-0"
          style={{ background: avatarGradient ?? "var(--color-line)" }}
        >
          {iniciales ?? "?"}
        </span>
      ) : (
        <span
          className={`w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 border ${iconStyle.bg} ${iconStyle.border} ${iconStyle.text}`}
        >
          {Icon && <Icon className="w-[13px] h-[13px]" strokeWidth={2} />}
        </span>
      )}
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink leading-[1.3] truncate">
          {title}
        </div>
        {meta && (
          <div className="text-[11px] text-muted flex items-center gap-1.5 truncate">
            {estadoTag && (
              <span
                className={`text-[9.5px] px-1.5 py-[1px] rounded-full font-semibold uppercase tracking-[0.04em] shrink-0 ${ESTADO_TAG_CLASS[estadoTag]}`}
              >
                {ESTADO_TAG_LABEL[estadoTag]}
              </span>
            )}
            <span className="truncate">{meta}</span>
          </div>
        )}
      </div>
      {shortcut && shortcut.length > 0 && (
        <div className="flex items-center gap-[3px] shrink-0">
          {shortcut.map((k) => (
            <span
              key={k}
              className="bg-panel border border-line px-[5px] py-px rounded-[3px] font-mono text-[9.5px] text-muted font-medium min-w-[16px] text-center"
            >
              {k}
            </span>
          ))}
        </div>
      )}
      {showArrow && (
        <ArrowRight
          className={`w-3.5 h-3.5 shrink-0 ${selected ? "text-violeta" : "text-muted-2"}`}
          strokeWidth={2}
        />
      )}
    </button>
  );
}
