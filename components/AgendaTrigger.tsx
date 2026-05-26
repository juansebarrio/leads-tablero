"use client";

import { Calendar } from "lucide-react";
import { useDrawers } from "@/components/drawer-context";

interface AgendaTriggerProps {
  count: number;
}

// Botón "Tu día" inline en el hero. En desktop (≥md) se renderiza al lado
// de Exportar y Nuevo lead. En sub-md no se muestra: el ícono del
// TopbarMobile (también esquina sup-der) cumple el rol.
export function AgendaTrigger({ count }: AgendaTriggerProps) {
  const { openAgenda } = useDrawers();
  return (
    <button
      type="button"
      onClick={openAgenda}
      aria-label="Abrir agenda"
      className="
        hidden md:inline-flex items-center gap-1.5
        border border-line bg-panel text-ink-2 px-3.5 py-2 rounded-md
        font-medium text-[12.5px] cursor-pointer whitespace-nowrap
        hover:border-ink-2 transition
      "
    >
      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
      Tu día
      {count > 0 && (
        <span className="bg-rojo text-white text-[10.5px] font-bold rounded-full px-1.5 ml-0.5 leading-tight">
          {count}
        </span>
      )}
    </button>
  );
}
