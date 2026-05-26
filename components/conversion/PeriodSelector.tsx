"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { PeriodoConversion } from "@/lib/types";

const OPCIONES: { value: PeriodoConversion; label: string }[] = [
  { value: "mes_actual", label: "Este mes" },
  { value: "mes_anterior", label: "Mes anterior" },
  { value: "trimestre", label: "Trimestre" },
];

interface PeriodSelectorProps {
  current: PeriodoConversion;
}

// Toggle de período. Cambia el query param ?period= y refetcha el page.
export function PeriodSelector({ current }: PeriodSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setPeriod = (p: PeriodoConversion) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    startTransition(() => {
      router.push(`/conversion?${params.toString()}`);
    });
  };

  return (
    <div className="inline-flex bg-panel border border-line rounded-lg p-1 gap-0.5 shrink-0">
      {OPCIONES.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => setPeriod(o.value)}
            disabled={pending}
            className={`
              px-3 py-1.5 rounded-md font-medium text-[12.5px] cursor-pointer transition
              ${active ? "bg-ink text-white" : "text-muted hover:text-ink"}
              disabled:opacity-60
            `}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
