"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportarTrigger() {
  return (
    <button
      type="button"
      onClick={() =>
        toast("Exportar leads", {
          description:
            "Vas a poder bajar la lista filtrada en CSV/Excel desde acá.",
        })
      }
      className="flex-1 md:flex-none border border-line bg-panel text-ink-2 px-3.5 py-2 rounded-md font-medium text-[12.5px] hover:border-ink-2 inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
    >
      <Download className="w-3.5 h-3.5" strokeWidth={2} />
      Exportar
    </button>
  );
}
