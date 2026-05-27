"use client";

import { useGlobalShortcuts } from "@/components/busqueda/use-global-shortcuts";

// Wrapper para montar los atajos globales (⌘K, N, G+letra) dentro de los
// providers (DrawerProvider + CommandPaletteProvider). No renderiza nada.
export function GlobalShortcuts() {
  useGlobalShortcuts();
  return null;
}
