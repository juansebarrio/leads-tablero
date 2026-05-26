"use client";

import { Calendar } from "lucide-react";
import { useDrawers } from "@/components/drawer-context";

interface AgendaTriggerProps {
  count: number;
}

// Botón "Tu día" del hero — solo visible en el breakpoint Desktop (1024–1279),
// donde la sidebar entra pero la agenda lateral se convirtió en drawer.
export function AgendaTrigger({ count }: AgendaTriggerProps) {
  const { openAgenda } = useDrawers();
  return (
    <button
      type="button"
      onClick={openAgenda}
      className="hidden lg:inline-flex xl:hidden items-center gap-1.5 border border-line bg-panel text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] hover:border-ink-2 transition cursor-pointer whitespace-nowrap"
    >
      <Calendar className="w-3.5 h-3.5" strokeWidth={2} />
      Tu día
      <span className="bg-rojo text-white text-[10.5px] font-bold rounded-full px-1.5 ml-0.5 leading-tight">
        {count}
      </span>
    </button>
  );
}
