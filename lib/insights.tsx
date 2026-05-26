// Detección automática del "cuello del embudo" para el banner de /conversion.

import type { FunnelData, TimingItem } from "@/lib/types";

export type CuelloEtapa =
  | "nuevo_a_conv"
  | "conv_a_prop"
  | "prop_a_cierre"
  | "cierre_a_ganado";

const ETAPA_LABEL: Record<CuelloEtapa, string> = {
  nuevo_a_conv: "Nuevos → En conversación",
  conv_a_prop: "En conversación → Propuesta",
  prop_a_cierre: "Propuesta → Cierre",
  cierre_a_ganado: "Cierre → Ganado",
};

// Para matchear las transiciones del v_tiempo_por_etapa.
const ETAPA_TIMING: Record<CuelloEtapa, { from: string; to: string }> = {
  nuevo_a_conv: { from: "inicio", to: "conversacion" },
  conv_a_prop: { from: "conversacion", to: "propuesta" },
  prop_a_cierre: { from: "propuesta", to: "cierre" },
  cierre_a_ganado: { from: "cierre", to: "ganado" },
};

export type Insight = {
  cuello: CuelloEtapa | null;
  cuello_label: string | null;
  ratio_pct: number; // 0–100
  dias_promedio: number;
  texto: React.ReactNode;
};

export function computeInsight(
  funnel: FunnelData,
  timing: TimingItem[],
): Insight {
  // Ratios de conversión entre etapas (0–1).
  const ratios: Array<{ etapa: CuelloEtapa; ratio: number }> = [];
  if (funnel.nuevos_total > 0) {
    ratios.push({
      etapa: "nuevo_a_conv",
      ratio: funnel.conversacion_acum / funnel.nuevos_total,
    });
  }
  if (funnel.conversacion_acum > 0) {
    ratios.push({
      etapa: "conv_a_prop",
      ratio: funnel.propuesta_acum / funnel.conversacion_acum,
    });
  }
  if (funnel.propuesta_acum > 0) {
    ratios.push({
      etapa: "prop_a_cierre",
      ratio: funnel.cierre_acum / funnel.propuesta_acum,
    });
  }
  if (funnel.cierre_acum > 0) {
    ratios.push({
      etapa: "cierre_a_ganado",
      ratio: funnel.ganados / funnel.cierre_acum,
    });
  }

  if (ratios.length === 0) {
    return {
      cuello: null,
      cuello_label: null,
      ratio_pct: 0,
      dias_promedio: 0,
      texto: "Todavía no hay suficientes leads este mes para detectar un cuello.",
    };
  }

  // El cuello = transición con peor ratio.
  ratios.sort((a, b) => a.ratio - b.ratio);
  const peor = ratios[0];
  const label = ETAPA_LABEL[peor.etapa];
  const ratioPct = Math.round(peor.ratio * 100);

  // Buscamos el timing de esa transición (si lo hay).
  const t = ETAPA_TIMING[peor.etapa];
  const timingMatch = timing.find(
    (x) => x.estado_from === t.from && x.estado_to === t.to,
  );
  const dias = timingMatch?.dias_promedio ?? 0;

  return {
    cuello: peor.etapa,
    cuello_label: label,
    ratio_pct: ratioPct,
    dias_promedio: dias,
    texto: (
      <>
        El cuello del embudo está en <strong>{label}</strong>. Solo{" "}
        <strong>{ratioPct}%</strong> de los leads pasan esa transición.
        {dias > 0 && (
          <>
            {" "}
            Los leads se quedan en promedio <strong>{dias} días</strong> antes
            de moverse o caerse.
          </>
        )}
      </>
    ),
  };
}
