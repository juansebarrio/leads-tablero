"use client";

import { useDrawers } from "@/components/drawer-context";

export function Backdrop() {
  const { sidebarOpen, agendaOpen, closeAll } = useDrawers();
  const active = sidebarOpen || agendaOpen;
  if (!active) return null;

  return (
    <div
      onClick={closeAll}
      className="fixed inset-0 z-60 bg-[rgba(14,14,18,0.4)]"
      style={{ zIndex: 60 }}
      aria-hidden
    />
  );
}
