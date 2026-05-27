"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useDrawers } from "@/components/drawer-context";
import { useCommandPalette } from "@/components/busqueda/command-palette-context";

// Atajos globales que viven en el shell (DashboardLayout).
//
// - ⌘K / Ctrl+K: toggle del command palette (siempre, incluso en inputs).
// - N: abre Nuevo lead. Solo cuando el foco NO está en un input.
// - G + (H/P/E/C/I/K): navegación. Buffer de 1s tras G; si llega la 2da
//   letra a tiempo, navega; sino, descarta. Solo fuera de inputs.
//
// El atajo R (Registrar contacto) requiere contexto de lead: lo expone el
// componente que esté en la ficha del lead, no el shell global.
export function useGlobalShortcuts() {
  const router = useRouter();
  const { toggle: togglePalette, close: closePalette } = useCommandPalette();
  const { openNuevoLead } = useDrawers();
  const prefixGRef = useRef<number | null>(null);

  useEffect(() => {
    function isTypingTarget(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        t.isContentEditable
      );
    }

    function handler(e: KeyboardEvent) {
      // ⌘K / Ctrl+K — siempre, también dentro de inputs.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
        return;
      }

      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // Segunda tecla de la secuencia G+?
      if (prefixGRef.current !== null) {
        window.clearTimeout(prefixGRef.current);
        prefixGRef.current = null;
        const ruta = NAV_KEY_TO_PATH[key];
        if (ruta) {
          e.preventDefault();
          closePalette();
          router.push(ruta);
        }
        return;
      }

      if (key === "g") {
        e.preventDefault();
        prefixGRef.current = window.setTimeout(() => {
          prefixGRef.current = null;
        }, 1000);
        return;
      }

      if (key === "n") {
        e.preventDefault();
        closePalette();
        openNuevoLead();
      }
    }

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (prefixGRef.current !== null) {
        window.clearTimeout(prefixGRef.current);
      }
    };
  }, [togglePalette, closePalette, openNuevoLead, router]);
}

// Segunda letra de las secuencias G+ → ruta.
// Convención: G=Go to. H=Home, P=Pipeline, E=Equipo, C=Conversión,
// I=Inteligencia (Patrones), K=ciKierre (Cerrados).
const NAV_KEY_TO_PATH: Record<string, string> = {
  h: "/",
  p: "/pipeline",
  e: "/equipo",
  c: "/conversion",
  i: "/patrones",
  k: "/cerrados",
};
