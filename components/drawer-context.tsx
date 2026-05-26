"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Un solo drawer puede estar activo a la vez. Si abrís uno, el anterior
// se cierra automáticamente. Esto evita que se vean dos overlays superpuestos
// (ej: Agenda detrás del form de Nuevo lead).
export type DrawerKind =
  | "sidebar"
  | "agenda"
  | "nuevo-lead"
  | "registrar-contacto";

type RegistrarContactoData = { leadId: string; leadNombre: string };

type DrawerState = {
  active: DrawerKind | null;
  registrarContactoData: RegistrarContactoData | null;

  openSidebar: () => void;
  openAgenda: () => void;
  openNuevoLead: () => void;
  openRegistrarContacto: (data: RegistrarContactoData) => void;
  closeAll: () => void;

  // Helper: ¿está abierto este drawer?
  isOpen: (kind: DrawerKind) => boolean;
};

const DrawerContext = createContext<DrawerState | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<DrawerKind | null>(null);
  const [registrarContactoData, setRegistrarContactoData] =
    useState<RegistrarContactoData | null>(null);

  const value = useMemo<DrawerState>(
    () => ({
      active,
      registrarContactoData,
      openSidebar: () => {
        setRegistrarContactoData(null);
        setActive("sidebar");
      },
      openAgenda: () => {
        setRegistrarContactoData(null);
        setActive("agenda");
      },
      openNuevoLead: () => {
        setRegistrarContactoData(null);
        setActive("nuevo-lead");
      },
      openRegistrarContacto: (data) => {
        setRegistrarContactoData(data);
        setActive("registrar-contacto");
      },
      closeAll: () => {
        setActive(null);
        // Mantener registrarContactoData para que el componente termine de
        // animar la salida sin perder el lead. Se limpia al abrir otro.
      },
      isOpen: (kind) => active === kind,
    }),
    [active, registrarContactoData],
  );

  // Escape cierra el drawer activo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
}

export function useDrawers(): DrawerState {
  const ctx = useContext(DrawerContext);
  if (!ctx) {
    throw new Error("useDrawers debe usarse dentro de <DrawerProvider>");
  }
  return ctx;
}
