"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

// Estado y atajos globales del command palette. Vive en un Context para
// no sumar Zustand. Provee:
//  - isOpen + open/close/toggle
//  - recentLeadIds (persistido en localStorage)
//  - pushRecent(id) cuando se visita un lead

const STORAGE_KEY = "js80:recientes:lead_ids";
const MAX_RECIENTES = 8;

type State = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  recentLeadIds: string[];
  pushRecent: (leadId: string) => void;
};

const Ctx = createContext<State | null>(null);

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [recentLeadIds, setRecentLeadIds] = useState<string[]>([]);

  // Hidratamos en cliente para evitar mismatch SSR.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentLeadIds(parsed.filter((x): x is string => typeof x === "string"));
        }
      }
    } catch {
      // Storage roto / no disponible: arrancamos vacío.
    }
  }, []);

  const persist = useCallback((arr: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      // ignore
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const pushRecent = useCallback(
    (leadId: string) => {
      setRecentLeadIds((prev) => {
        const next = [leadId, ...prev.filter((id) => id !== leadId)].slice(
          0,
          MAX_RECIENTES,
        );
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<State>(
    () => ({ isOpen, open, close, toggle, recentLeadIds, pushRecent }),
    [isOpen, open, close, toggle, recentLeadIds, pushRecent],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommandPalette(): State {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useCommandPalette debe usarse dentro de <CommandPaletteProvider>",
    );
  }
  return ctx;
}
