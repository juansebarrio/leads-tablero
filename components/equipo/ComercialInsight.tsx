"use client";

import { AlertCircle, Check } from "lucide-react";

export type InsightTipo = "good" | "warn" | "danger" | "neutral";

export type Insight = {
  tipo: InsightTipo;
  // Permite JSX (negritas dentro del mensaje).
  texto: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void; // ejecutado client-side si se conecta más adelante
    href?: string;
  };
};

interface ComercialInsightProps {
  insight: Insight;
}

const STYLE: Record<
  InsightTipo,
  { bg: string; border: string; text: string }
> = {
  good: {
    bg: "bg-verde-soft",
    border: "border-[#C9E2D2]",
    text: "text-verde",
  },
  warn: {
    bg: "bg-amarillo-soft",
    border: "border-[#EBD9A1]",
    text: "text-amarillo",
  },
  danger: {
    bg: "bg-rojo-soft",
    border: "border-[#F2C8C2]",
    text: "text-rojo",
  },
  neutral: {
    bg: "bg-violeta-soft",
    border: "border-[#D6CAFF]",
    text: "text-violeta",
  },
};

export function ComercialInsight({ insight }: ComercialInsightProps) {
  const s = STYLE[insight.tipo];
  const Icon = insight.tipo === "good" ? Check : AlertCircle;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-[12px] leading-[1.4] ${s.bg} ${s.border} ${s.text}`}
    >
      <Icon
        className="w-3.5 h-3.5 shrink-0"
        strokeWidth={insight.tipo === "good" ? 2.4 : 2}
      />
      <span className="flex-1 min-w-0">{insight.texto}</span>
      {insight.action && (
        <a
          // stopPropagation para que el click no dispare la navegación de la
          // card que envuelve este insight.
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          href={insight.action.href ?? "#"}
          className="underline font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          {insight.action.label}
        </a>
      )}
    </div>
  );
}
