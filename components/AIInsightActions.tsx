"use client";

import { toast } from "sonner";

interface InsightActionsProps {
  cantidad: number;
}

export function InsightActions({ cantidad }: InsightActionsProps) {
  return (
    <div className="flex gap-2 w-full md:w-auto">
      <button
        type="button"
        onClick={() =>
          toast(`Ver los ${cantidad} leads sin asignar`, {
            description:
              "Vas a aterrizar en una vista filtrada del pipeline con esos leads.",
          })
        }
        className="flex-1 md:flex-none bg-panel border border-line text-ink-2 px-3 py-2 rounded-md font-medium text-[12px] hover:border-violeta hover:text-violeta transition cursor-pointer whitespace-nowrap"
      >
        Ver los {cantidad}
      </button>
      <button
        type="button"
        onClick={() =>
          toast("Revisar regla de asignación", {
            description:
              "Editás la regla de auto-asignación de leads que vienen del formulario.",
          })
        }
        className="flex-1 md:flex-none bg-violeta border border-violeta text-white px-3 py-2 rounded-md font-medium text-[12px] hover:opacity-90 transition cursor-pointer whitespace-nowrap"
      >
        Revisar regla
      </button>
    </div>
  );
}
