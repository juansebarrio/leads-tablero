"use client";

import { useDrawers } from "@/components/drawer-context";

export function Backdrop() {
  const { sidebarOpen, agendaOpen, closeAll } = useDrawers();
  const active = sidebarOpen || agendaOpen;
  if (!active) return null;

  // En xl el AgendaPanel es sticky (no drawer), y el SidebarLeft también
  // (en lg+). Si solo está abierta agenda en xl, ocultamos el backdrop.
  const hideClasses = sidebarOpen
    ? "lg:hidden" // sidebar drawer existe solo en <lg
    : "lg:hidden xl:hidden"; // agenda drawer existe solo en <xl

  return (
    <div
      onClick={closeAll}
      className={`fixed inset-0 z-60 bg-[rgba(14,14,18,0.4)] ${hideClasses}`}
      style={{ zIndex: 60 }}
      aria-hidden
    />
  );
}
