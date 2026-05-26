"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Atajos de teclado globales.
// Hoy solo Cmd/Ctrl+K (que en futuro abre el command palette real).
// preventDefault para no chocar con el Vercel Toolbar.
export function GlobalShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toast("Búsqueda en construcción", {
          description:
            "Pronto vas a poder saltar a cualquier lead, comercial o reunión desde acá.",
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
