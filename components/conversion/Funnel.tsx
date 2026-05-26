import { ChevronDown, ChevronUp } from "lucide-react";
import type { FunnelData } from "@/lib/types";
import type { CuelloEtapa } from "@/lib/insights";

interface FunnelProps {
  actual: FunnelData;
  anterior: FunnelData;
  cuello: CuelloEtapa | null;
}

type StageKey = "nuevo" | "conversacion" | "propuesta" | "cierre" | "ganado";

const STAGE_FILL: Record<StageKey, string> = {
  nuevo:
    "bg-[linear-gradient(90deg,#B6C6FF_0%,var(--color-azul)_100%)] text-white",
  conversacion:
    "bg-[linear-gradient(90deg,var(--color-azul)_0%,var(--color-violeta)_100%)] text-white",
  propuesta:
    "bg-[linear-gradient(90deg,var(--color-violeta)_0%,#B07AFF_100%)] text-white",
  cierre:
    "bg-[linear-gradient(90deg,var(--color-coral)_0%,#FFB088_100%)] text-ink",
  ganado:
    "bg-[linear-gradient(90deg,#5BAE7A_0%,var(--color-verde)_100%)] text-white",
};

const STAGE_LABEL: Record<StageKey, string> = {
  nuevo: "Nuevos",
  conversacion: "En conversación",
  propuesta: "Propuesta",
  cierre: "Cierre",
  ganado: "Ganados",
};

export function Funnel({ actual, anterior, cuello }: FunnelProps) {
  const stages = computeStages(actual, anterior);
  const transitions = computeTransitions(actual, cuello);

  return (
    <div className="flex flex-col gap-3.5">
      {stages.map((s, i) => (
        <div key={s.key}>
          <FunnelStage stage={s} />
          {transitions[i] && (
            <FunnelTransition transition={transitions[i]!} />
          )}
        </div>
      ))}
    </div>
  );
}

type Stage = {
  key: StageKey;
  cantidad: number;
  pct: number; // % del total (0–100)
  delta: { value: string; direction: "up" | "down" | "neutral" } | null;
  subLabel: string;
};

function computeStages(actual: FunnelData, anterior: FunnelData): Stage[] {
  const base = actual.nuevos_total || 1; // evitar /0; si total=0, todo es 0%
  const baseAnt = anterior.nuevos_total || 1;

  const cant: Record<StageKey, number> = {
    nuevo: actual.nuevos_total,
    conversacion: actual.conversacion_acum,
    propuesta: actual.propuesta_acum,
    cierre: actual.cierre_acum,
    ganado: actual.ganados,
  };
  const cantAnt: Record<StageKey, number> = {
    nuevo: anterior.nuevos_total,
    conversacion: anterior.conversacion_acum,
    propuesta: anterior.propuesta_acum,
    cierre: anterior.cierre_acum,
    ganado: anterior.ganados,
  };

  const orden: StageKey[] = ["nuevo", "conversacion", "propuesta", "cierre", "ganado"];
  return orden.map((key) => {
    const pct = Math.round((cant[key] / base) * 100);
    const pctAnt = Math.round((cantAnt[key] / baseAnt) * 100);
    const diff = pct - pctAnt;
    const delta =
      anterior.nuevos_total === 0
        ? null
        : {
            value: diff === 0 ? "0 pp" : `${diff > 0 ? "+" : ""}${diff} pp`,
            direction: (diff > 0 ? "up" : diff < 0 ? "down" : "neutral") as
              | "up"
              | "down"
              | "neutral",
          };
    const subLabel =
      key === "nuevo"
        ? "100% · base del embudo"
        : key === "ganado"
          ? `${pct}% del total · ratio final`
          : `${pct}% del total`;
    return { key, cantidad: cant[key], pct, delta, subLabel };
  });
}

type Transition = {
  pct: number; // 0–100
  pasan: number;
  total: number;
  isCuello: boolean;
};

function computeTransitions(
  actual: FunnelData,
  cuello: CuelloEtapa | null,
): (Transition | null)[] {
  // Para 5 etapas hay 4 transiciones. Devolvemos 5 elementos: i = transición
  // *después* de la etapa i. La quinta (después de ganados) es null.
  const pairs: Array<{
    etapa: CuelloEtapa;
    total: number;
    pasan: number;
  }> = [
    { etapa: "nuevo_a_conv", total: actual.nuevos_total, pasan: actual.conversacion_acum },
    { etapa: "conv_a_prop", total: actual.conversacion_acum, pasan: actual.propuesta_acum },
    { etapa: "prop_a_cierre", total: actual.propuesta_acum, pasan: actual.cierre_acum },
    { etapa: "cierre_a_ganado", total: actual.cierre_acum, pasan: actual.ganados },
  ];

  return pairs
    .map<Transition | null>((p) => {
      if (p.total === 0) return null;
      return {
        pct: Math.round((p.pasan / p.total) * 100),
        pasan: p.pasan,
        total: p.total,
        isCuello: cuello === p.etapa,
      };
    })
    .concat([null]); // después de ganados no hay transición
}

function FunnelStage({ stage }: { stage: Stage }) {
  const fillClass = STAGE_FILL[stage.key];
  const label = STAGE_LABEL[stage.key];
  // Si la barra es muy chica, el label va afuera.
  const barraChica = stage.pct < 20;
  // Width visual: minimum visible 4% para que la barra se vea aunque haya 0
  const widthVisible = Math.max(stage.pct, stage.cantidad > 0 ? 4 : 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[130px_1fr_100px] xl:grid-cols-[140px_1fr_120px] gap-3 md:gap-4 xl:gap-5 items-center">
      <div className="flex md:block items-baseline justify-between">
        <div className="text-[13px] text-ink font-semibold">{label}</div>
        <div className="text-[11px] text-muted">{stage.subLabel}</div>
      </div>
      <div className="bg-panel-2 border border-line-2 rounded-lg h-11 md:h-12 relative overflow-hidden flex items-center">
        <div
          className={`h-full rounded-md flex items-center gap-3 px-3 md:px-4 transition-[width] duration-400 min-w-0 ${fillClass} ${barraChica ? "justify-center" : ""}`}
          style={{ width: `${widthVisible}%` }}
        >
          <span
            className="font-display font-semibold text-[17px] md:text-[19px] xl:text-[22px] -tracking-[0.015em]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            {stage.cantidad}
          </span>
          {!barraChica && (
            <span className="ml-auto text-[12.5px] font-semibold opacity-90">
              {stage.pct}%
            </span>
          )}
        </div>
        {barraChica && stage.cantidad > 0 && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-ink whitespace-nowrap"
            style={{ left: `calc(${widthVisible}% + 12px)` }}
          >
            {stage.pct}%
          </span>
        )}
      </div>
      <div className="md:text-right flex md:block items-center gap-2">
        {stage.delta && (
          <span
            className={`inline-flex items-center gap-1 text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${
              stage.delta.direction === "up"
                ? "bg-verde-soft text-verde"
                : stage.delta.direction === "down"
                  ? "bg-rojo-soft text-rojo"
                  : "bg-line-2 text-muted"
            }`}
          >
            {stage.delta.direction === "up" && (
              <ChevronUp className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            {stage.delta.direction === "down" && (
              <ChevronDown className="w-2.5 h-2.5" strokeWidth={3} />
            )}
            {stage.delta.value}
          </span>
        )}
        {stage.delta && (
          <span className="text-[10.5px] text-muted md:block">vs anterior</span>
        )}
      </div>
    </div>
  );
}

function FunnelTransition({ transition }: { transition: Transition }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[130px_1fr_100px] xl:grid-cols-[140px_1fr_120px] gap-3 md:gap-4 xl:gap-5 items-center py-1">
      <div className="hidden md:block" />
      <div className="flex items-center gap-2 md:pl-5 text-[11.5px] text-muted">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted-2 shrink-0"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
        <span
          className={`font-bold ${transition.isCuello ? "text-amarillo" : "text-ink-2"}`}
        >
          {transition.pct}%
        </span>
        <span>
          conversión · {transition.pasan} de {transition.total} pasan
          {transition.isCuello && (
            <>
              {" · "}
              <strong className="text-amarillo">cuello del mes</strong>
            </>
          )}
        </span>
      </div>
      <div className="hidden md:block" />
    </div>
  );
}
