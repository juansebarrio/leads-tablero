"use client";

import { Info, Plus, Search } from "lucide-react";
import { useDrawers } from "@/components/drawer-context";

interface Props {
  query: string;
  onClose: () => void;
}

export function EmptyResults({ query, onClose }: Props) {
  const { openNuevoLead } = useDrawers();

  return (
    <div className="px-6 py-12 text-center text-muted">
      <div className="w-12 h-12 mx-auto mb-3.5 bg-panel-2 rounded-full flex items-center justify-center text-muted-2">
        <Search className="w-[22px] h-[22px]" strokeWidth={2} />
      </div>
      <div
        className="font-display font-medium text-[16px] text-ink mb-1.5 -tracking-[0.01em]"
        style={{ fontVariationSettings: '"opsz" 144' }}
      >
        No hay{" "}
        <em className="italic text-violeta font-medium">resultados</em> para
        “{query}”
      </div>
      <div className="text-[12.5px] text-muted mb-4 leading-[1.5]">
        Probá con otra palabra o creá algo nuevo desde acá.
      </div>
      <div className="flex flex-col gap-2 max-w-[260px] mx-auto">
        <button
          type="button"
          onClick={() => {
            onClose();
            openNuevoLead();
          }}
          className="bg-panel-2 border border-line rounded-md px-3 py-2 text-[12px] text-ink-2 flex items-center gap-2 text-left hover:border-ink-2 hover:bg-panel cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-violeta shrink-0" strokeWidth={2} />
          Crear un lead nuevo con “{query}”
        </button>
        <button
          type="button"
          disabled
          title="Próximamente"
          className="bg-panel-2 border border-line rounded-md px-3 py-2 text-[12px] text-muted-2 flex items-center gap-2 text-left cursor-not-allowed opacity-60"
        >
          <Info className="w-3.5 h-3.5 text-violeta shrink-0" strokeWidth={2} />
          Buscar también en archivados
        </button>
      </div>
    </div>
  );
}
