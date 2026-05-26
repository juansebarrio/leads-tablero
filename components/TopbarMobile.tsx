"use client";

import { Calendar, Menu } from "lucide-react";
import { Nucleus } from "@/components/Nucleus";
import { useDrawers } from "@/components/drawer-context";

interface TopbarMobileProps {
  agendaCount: number;
}

export function TopbarMobile({ agendaCount }: TopbarMobileProps) {
  const { openSidebar, openAgenda } = useDrawers();

  return (
    <header className="flex lg:hidden sticky top-0 z-50 bg-panel border-b border-line p-3 px-4 items-center justify-between gap-3">
      <button
        type="button"
        onClick={openSidebar}
        aria-label="Abrir menú"
        className="w-[38px] h-[38px] rounded-md bg-panel border border-line inline-flex items-center justify-center text-ink-2 hover:border-ink cursor-pointer"
      >
        <Menu className="w-5 h-5" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-2">
        <Nucleus size={24} />
        <span className="font-display font-semibold text-[15px] -tracking-[0.01em]">
          js80
        </span>
      </div>

      <button
        type="button"
        onClick={openAgenda}
        aria-label="Ver agenda"
        className="relative w-[38px] h-[38px] rounded-md bg-panel border border-line inline-flex items-center justify-center text-ink-2 hover:border-ink cursor-pointer"
      >
        <Calendar className="w-[18px] h-[18px]" strokeWidth={2} />
        {agendaCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rojo text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center border-2 border-panel">
            {agendaCount}
          </span>
        )}
      </button>
    </header>
  );
}
