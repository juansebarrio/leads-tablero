"use client";

import { motion } from "framer-motion";
import type { Comercial } from "@/lib/types";

export type FiltroComercial =
  | { tipo: "todos" }
  | { tipo: "sin_asignar" }
  | { tipo: "comercial"; id: string };

interface ComercialFilterProps {
  comerciales: Comercial[];
  totalLeads: number;
  filtro: FiltroComercial;
  onChange: (f: FiltroComercial) => void;
}

export function ComercialFilter({
  comerciales,
  totalLeads,
  filtro,
  onChange,
}: ComercialFilterProps) {
  const isActive = (f: FiltroComercial) => {
    if (f.tipo === "todos") return filtro.tipo === "todos";
    if (f.tipo === "sin_asignar") return filtro.tipo === "sin_asignar";
    return filtro.tipo === "comercial" && filtro.id === f.id;
  };

  return (
    <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-1 lg:overflow-visible">
      <span className="text-[11px] text-muted tracking-[0.04em] uppercase font-semibold mr-1 shrink-0">
        Filtrar
      </span>

      <Chip
        active={isActive({ tipo: "todos" })}
        onClick={() => onChange({ tipo: "todos" })}
      >
        Todos · {totalLeads}
      </Chip>

      {comerciales.map((c) => (
        <Chip
          key={c.id}
          active={isActive({ tipo: "comercial", id: c.id })}
          onClick={() => onChange({ tipo: "comercial", id: c.id })}
        >
          <span
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-white text-[9.5px] font-bold shrink-0"
            style={{ background: c.avatar_gradient }}
          >
            {c.iniciales}
          </span>
          {c.nombre.split(" ")[0]}
        </Chip>
      ))}

      <Chip
        active={isActive({ tipo: "sin_asignar" })}
        onClick={() => onChange({ tipo: "sin_asignar" })}
      >
        <span className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-muted text-[9.5px] font-bold shrink-0 bg-line border border-dashed border-muted-2">
          ?
        </span>
        Sin asignar
      </Chip>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[12px] font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0
        ${
          active
            ? "bg-ink text-white border-ink"
            : "bg-panel text-ink-2 border-line hover:border-ink-2"
        }
      `}
    >
      {children}
    </motion.button>
  );
}
