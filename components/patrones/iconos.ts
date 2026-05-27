import {
  AlertTriangle,
  Clock,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { PatronTipo } from "@/lib/types";

export const TIPO_ICONO: Record<PatronTipo, LucideIcon> = {
  operativo: AlertTriangle,
  atasco: Clock,
  oportunidad: Target,
  tendencia: TrendingUp,
  sugerencia: Sparkles,
};

export const TIPO_LABEL: Record<PatronTipo, string> = {
  operativo: "Operativo",
  atasco: "Atasco",
  oportunidad: "Oportunidad",
  tendencia: "Tendencia",
  sugerencia: "Sugerencia",
};

// Mapeo de colores por tipo. Devolvemos clases Tailwind para uniformidad.
export const TIPO_STYLE: Record<
  PatronTipo,
  {
    accent: string; // CSS var del rail izquierdo
    iconBg: string;
    iconText: string;
    chipBg: string;
    chipText: string;
  }
> = {
  operativo: {
    accent: "var(--color-rojo)",
    iconBg: "bg-rojo-soft",
    iconText: "text-rojo",
    chipBg: "bg-rojo-soft",
    chipText: "text-rojo",
  },
  atasco: {
    accent: "var(--color-amarillo)",
    iconBg: "bg-amarillo-soft",
    iconText: "text-amarillo",
    chipBg: "bg-amarillo-soft",
    chipText: "text-amarillo",
  },
  oportunidad: {
    accent: "var(--color-verde)",
    iconBg: "bg-verde-soft",
    iconText: "text-verde",
    chipBg: "bg-verde-soft",
    chipText: "text-verde",
  },
  tendencia: {
    accent: "var(--color-azul)",
    iconBg: "bg-azul-soft",
    iconText: "text-azul",
    chipBg: "bg-azul-soft",
    chipText: "text-azul",
  },
  sugerencia: {
    accent: "var(--color-violeta)",
    iconBg: "bg-violeta-soft",
    iconText: "text-violeta",
    chipBg: "bg-violeta-soft",
    chipText: "text-violeta",
  },
};
