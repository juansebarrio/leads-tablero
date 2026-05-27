"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { PatronTipo } from "@/lib/types";
import { TIPO_LABEL } from "@/components/patrones/iconos";

interface Props {
  counts: Record<PatronTipo, number>;
  total: number;
}

const TIPOS: PatronTipo[] = [
  "operativo",
  "atasco",
  "oportunidad",
  "tendencia",
  "sugerencia",
];

// Chips de filtro. El estado vive en URL (?tipo=...). Sin selección
// muestra todos; con selección, filtra la lista. La lista (PatronesList)
// lee el mismo search param y oculta los que no matcheen.
export function PatronesFilters({ counts, total }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const current = params.get("tipo");

  const setTipo = useCallback(
    (tipo: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (tipo) next.set("tipo", tipo);
      else next.delete("tipo");
      const qs = next.toString();
      router.replace(qs ? `/patrones?${qs}` : "/patrones", { scroll: false });
    },
    [params, router],
  );

  return (
    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:overflow-visible mb-[18px] -mx-1 px-1 md:mx-0 md:px-0 overflow-x-auto pb-1 md:pb-0">
      <span className="text-[11px] text-muted tracking-[0.04em] uppercase font-semibold mr-1 shrink-0">
        Filtrar
      </span>
      <Chip
        label="Todos"
        count={total}
        active={!current}
        onClick={() => setTipo(null)}
      />
      {TIPOS.map((t) => (
        <Chip
          key={t}
          label={TIPO_LABEL[t] + "s"}
          count={counts[t]}
          active={current === t}
          onClick={() => setTipo(t)}
        />
      ))}
    </div>
  );
}

function Chip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-medium border transition shrink-0 cursor-pointer ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-panel text-ink-2 border-line hover:border-ink-2"
      }`}
    >
      {label}
      <span
        className={`text-[10.5px] px-1.5 py-px rounded-full font-semibold ${
          active ? "bg-white/15 text-white" : "bg-line-2 text-muted"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
