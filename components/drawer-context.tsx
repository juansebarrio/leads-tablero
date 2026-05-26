"use client";

import { createContext, useContext, useEffect, useState } from "react";

type DrawerState = {
  sidebarOpen: boolean;
  agendaOpen: boolean;
  openSidebar: () => void;
  openAgenda: () => void;
  closeAll: () => void;
};

const DrawerContext = createContext<DrawerState | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);

  const closeAll = () => {
    setSidebarOpen(false);
    setAgendaOpen(false);
  };
  const openSidebar = () => {
    setAgendaOpen(false);
    setSidebarOpen(true);
  };
  const openAgenda = () => {
    setSidebarOpen(false);
    setAgendaOpen(true);
  };

  // Escape cierra cualquier drawer abierto.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DrawerContext.Provider
      value={{ sidebarOpen, agendaOpen, openSidebar, openAgenda, closeAll }}
    >
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawers(): DrawerState {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useDrawers debe usarse dentro de <DrawerProvider>");
  }
  return ctx;
}
