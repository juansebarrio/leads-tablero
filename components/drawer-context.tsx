"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

// Un solo drawer puede estar activo a la vez. Si abrís uno, el anterior
// se cierra automáticamente. Esto evita que se vean dos overlays superpuestos
// (ej: Agenda detrás del form de Nuevo lead).
export type DrawerKind =
  | "sidebar"
  | "agenda"
  | "nuevo-lead"
  | "registrar-contacto"
  | "editar-lead"
  | "reasignar"
  | "marcar-perdido"
  | "confirmar-ganado";

type RegistrarContactoData = { leadId: string; leadNombre: string };

// Payload compartido por los 4 drawers que actúan sobre un lead específico.
// Cada drawer lee solo los campos que necesita; el resto puede ser null.
export type LeadActionData = {
  leadId: string;
  leadNombre: string;
  estadoActual: string;
  // Snapshot opcional para evitar refetch dentro del drawer.
  // Si está null, el form puede pedir los datos por sí mismo.
  origen?: string | null;
  origen_detalle?: string | null;
  valor_estimado?: number | null;
  tipo_negocio?: string | null;
  meses_compromiso?: number | null;
  proximo_paso?: string | null;
  proximo_paso_fecha?: string | null;
  responsable_id?: string | null;
  responsable_nombre?: string | null;
};

type DrawerState = {
  active: DrawerKind | null;
  registrarContactoData: RegistrarContactoData | null;
  leadActionData: LeadActionData | null;

  openSidebar: () => void;
  openAgenda: () => void;
  openNuevoLead: () => void;
  openRegistrarContacto: (data: RegistrarContactoData) => void;
  openEditarLead: (data: LeadActionData) => void;
  openReasignar: (data: LeadActionData) => void;
  openMarcarPerdido: (data: LeadActionData) => void;
  openConfirmarGanado: (data: LeadActionData) => void;
  closeAll: () => void;

  isOpen: (kind: DrawerKind) => boolean;
};

const DrawerContext = createContext<DrawerState | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<DrawerKind | null>(null);
  const [registrarContactoData, setRegistrarContactoData] =
    useState<RegistrarContactoData | null>(null);
  const [leadActionData, setLeadActionData] = useState<LeadActionData | null>(null);

  const value = useMemo<DrawerState>(
    () => ({
      active,
      registrarContactoData,
      leadActionData,
      openSidebar: () => {
        setActive("sidebar");
      },
      openAgenda: () => {
        setActive("agenda");
      },
      openNuevoLead: () => {
        setActive("nuevo-lead");
      },
      openRegistrarContacto: (data) => {
        setRegistrarContactoData(data);
        setActive("registrar-contacto");
      },
      openEditarLead: (data) => {
        setLeadActionData(data);
        setActive("editar-lead");
      },
      openReasignar: (data) => {
        setLeadActionData(data);
        setActive("reasignar");
      },
      openMarcarPerdido: (data) => {
        setLeadActionData(data);
        setActive("marcar-perdido");
      },
      openConfirmarGanado: (data) => {
        setLeadActionData(data);
        setActive("confirmar-ganado");
      },
      closeAll: () => {
        setActive(null);
        // Mantenemos los datos de acción para que la animación de salida
        // se complete sin perder el lead. Se sobreescriben al abrir otro.
      },
      isOpen: (kind) => active === kind,
    }),
    [active, registrarContactoData, leadActionData],
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
