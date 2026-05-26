"use client";

import { Calendar } from "lucide-react";
import { useDrawers } from "@/components/drawer-context";

interface AgendaTriggerProps {
  count: number;
}

// Botón flotante "Tu día" — esquina sup-der.
// Visible solo en el breakpoint Desktop (lg, 1024–1279): donde la sidebar
// ya entra pero la agenda lateral todavía es drawer.
// En sub-lg (mobile/tablet) usamos el ícono del TopbarMobile (también en
// esquina sup-der). En xl el panel agenda es visible siempre, no hace falta
// botón.
export function AgendaTrigger({ count }: AgendaTriggerProps) {
  const { openAgenda } = useDrawers();
  return (
    <button
      type="button"
      onClick={openAgenda}
      aria-label="Abrir agenda"
      className="
        hidden lg:inline-flex xl:hidden items-center gap-1.5
        fixed top-4 right-4 z-[60]
        border border-line bg-panel text-ink-2 px-3.5 py-2 rounded-md
        font-medium text-[12.5px] cursor-pointer whitespace-nowrap
        shadow-[0_2px_8px_rgba(14,14,18,0.06)]
        hover:border-ink-2 hover:shadow-[0_4px_12px_rgba(14,14,18,0.08)] transition
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
