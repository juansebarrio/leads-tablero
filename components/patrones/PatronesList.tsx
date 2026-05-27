"use client";

import { useSearchParams } from "next/navigation";
import { Children, isValidElement, useMemo } from "react";
import type { PatronTipo } from "@/lib/types";

interface Props {
  // Cada hijo es un PatronCard renderizado en el padre (Server). Anotamos
  // el tipo via data-tipo en el wrapper para filtrarlo acá.
  children: React.ReactNode;
}

// Wrapper Client que filtra los hijos (cada uno con data-tipo) según
// ?tipo=... de la URL. El padre Server Component sigue siendo dueño del
// render real de cada PatronCard.
export function PatronesList({ children }: Props) {
  const params = useSearchParams();
  const filtro = params.get("tipo") as PatronTipo | null;

  const visibles = useMemo(() => {
    const arr = Children.toArray(children);
    if (!filtro) return arr;
    return arr.filter((c) => {
      if (!isValidElement(c)) return true;
      const props = (c.props ?? {}) as { "data-tipo"?: string };
      return props["data-tipo"] === filtro;
    });
  }, [children, filtro]);

  if (visibles.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-lg px-5 py-8 text-center text-[13px] text-muted">
        No hay patrones de ese tipo activos en este momento.
      </div>
    );
  }
  return <div className="flex flex-col gap-3.5">{visibles}</div>;
}
