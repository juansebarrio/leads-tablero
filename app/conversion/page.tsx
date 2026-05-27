import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { Funnel } from "@/components/conversion/Funnel";
import { InsightBanner } from "@/components/conversion/InsightBanner";
import { KpiCard } from "@/components/conversion/KpiCard";
import { PeriodSelector } from "@/components/conversion/PeriodSelector";
import { TimingStrip } from "@/components/conversion/TimingStrip";
import { TrendChart } from "@/components/conversion/TrendChart";
import { getCurrentUser } from "@/lib/auth";
import { formatMesAnio, formatUSDCorto } from "@/lib/format";
import { computeInsight } from "@/lib/insights";
import {
  getAgendaDia,
  getFunnelData,
  getLeadsFrios,
  getCierreMesData,
  getLeadsParaKanban,
  getPatronesActivosCount,
  getPipelineResumen,
  getTimingData,
  getTrendData,
} from "@/lib/queries";
import type { FunnelData, PeriodoConversion } from "@/lib/types";

interface SearchParams {
  period?: string;
}

export default async function ConversionPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const period: PeriodoConversion =
    params.period === "mes_anterior"
      ? "mes_anterior"
      : params.period === "trimestre"
        ? "trimestre"
        : "mes_actual";

  // Mapeo del período → meses_atras para la query.
  const mesesAtras =
    period === "mes_actual" ? 0 : period === "mes_anterior" ? 1 : 0;
  // Para "trimestre" sumamos los 3 últimos meses.

  let datos;
  try {
    const [
      currentUser,
      funnelActual,
      funnelTrimestre,
      funnelComparacion,
      timing,
      trend,
      pipeline,
      frios,
      agendaEvents,
      leadsKanban,
      patronesCount,
      cierreMes,
    ] = await Promise.all([
      getCurrentUser(),
      getFunnelData(mesesAtras),
      getFunnelTrimestre(),
      getFunnelData(mesesAtras + 1),
      getTimingData(),
      getTrendData(3),
      getPipelineResumen(),
      getLeadsFrios(),
      getAgendaDia(),
      getLeadsParaKanban(),
      getPatronesActivosCount(),
      getCierreMesData(),
    ]);
    datos = {
      currentUser,
      funnelActual,
      funnelTrimestre,
      funnelComparacion,
      timing,
      trend,
      pipeline,
      frios,
      agendaEvents,
      leadsKanban,
      patronesCount,
      cierreMes,
    };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar el análisis"
        mensaje="Probablemente la base de datos local no está corriendo o faltan las variables de entorno."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const {
    currentUser,
    funnelActual,
    funnelTrimestre,
    funnelComparacion,
    timing,
    trend,
    pipeline,
    frios,
    agendaEvents,
    leadsKanban,
    patronesCount,
    cierreMes,
  } = datos;

  // El funnel y los KPIs se sirven del período activo. Para "trimestre"
  // usamos el sumado trimestral.
  const funnelMostrado =
    period === "trimestre" ? funnelTrimestre : funnelActual;
  const insight = computeInsight(funnelMostrado, timing);

  const counts = {
    atenderHoy: frios.length,
    agenda: agendaEvents.length,
    pipeline: leadsKanban.length,
    nuevos: pipeline.find((p) => p.estado === "nuevo")?.cantidad ?? 0,
    conversacion:
      pipeline.find((p) => p.estado === "conversacion")?.cantidad ?? 0,
    propuesta: pipeline.find((p) => p.estado === "propuesta")?.cantidad ?? 0,
    ganados: pipeline.find((p) => p.estado === "ganado")?.cantidad ?? null,
    patrones: patronesCount,
  };

  const eyebrowMes = formatMesAnio();
  const ratioCierrePct =
    funnelMostrado.nuevos_total === 0
      ? 0
      : Math.round((funnelMostrado.ganados / funnelMostrado.nuevos_total) * 100);
  const ratioCierreAntPct =
    funnelComparacion.nuevos_total === 0
      ? 0
      : Math.round(
          (funnelComparacion.ganados / funnelComparacion.nuevos_total) * 100,
        );
  const deltaRatio = ratioCierrePct - ratioCierreAntPct;
  const deltaCreados = pct(
    funnelMostrado.nuevos_total,
    funnelComparacion.nuevos_total,
  );
  const deltaGanados = pct(funnelMostrado.ganados, funnelComparacion.ganados);
  const deltaValor = pct(funnelMostrado.valor_ganado, funnelComparacion.valor_ganado);

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={cierreMes}
      currentUser={currentUser}
    >
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-7">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
            Conversión · {eyebrowMes}
          </div>
          <h1
            className="font-display text-[26px] md:text-[30px] xl:text-[36px] font-medium leading-[1.05] -tracking-[0.025em] text-ink mb-2.5 text-balance"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Dónde estamos{" "}
            <em className="italic text-violeta font-medium">
              perdiendo leads
            </em>
            .
          </h1>
          <div className="text-[12.5px] md:text-[13.5px] text-muted">
            Análisis del embudo del{" "}
            {period === "trimestre"
              ? "trimestre actual"
              : period === "mes_anterior"
                ? "mes anterior"
                : "mes en curso"}
            , comparado con el período anterior.
          </div>
        </div>
        <PeriodSelector current={period} />
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 md:gap-3 mb-7">
        <KpiCard
          label="Leads creados"
          value={String(funnelMostrado.nuevos_total)}
          delta={deltaCreados}
          sub={`vs ${funnelComparacion.nuevos_total}`}
        />
        <KpiCard
          label="Leads ganados"
          value={String(funnelMostrado.ganados)}
          delta={deltaGanados}
          sub={`vs ${funnelComparacion.ganados}`}
        />
        <KpiCard
          label="Ratio de cierre"
          value={`${ratioCierrePct}%`}
          delta={{
            value:
              deltaRatio === 0
                ? "0 pp"
                : `${deltaRatio > 0 ? "+" : ""}${deltaRatio} pp`,
            direction:
              deltaRatio > 0 ? "up" : deltaRatio < 0 ? "down" : "neutral",
          }}
          sub={`vs ${ratioCierreAntPct}%`}
        />
        <KpiCard
          label="Valor cerrado"
          value={`USD ${formatUSDCorto(funnelMostrado.valor_ganado)}`}
          delta={deltaValor}
          sub={`vs USD ${formatUSDCorto(funnelComparacion.valor_ganado)}`}
        />
      </div>

      <InsightBanner insight={insight} />

      {/* Funnel */}
      <section className="bg-panel border border-line rounded-[12px] p-5 md:p-[26px] md:px-7 mb-5">
        <div className="flex items-baseline justify-between gap-3.5 mb-5">
          <h2
            className="font-display font-medium text-xl md:text-[22px] -tracking-[0.02em] leading-none text-ink text-balance"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            El <em className="italic text-violeta font-medium">embudo</em>
          </h2>
          <div className="text-[12px] text-muted">
            {funnelMostrado.nuevos_total} leads ingresaron ·{" "}
            {funnelMostrado.ganados} cerraron
          </div>
        </div>
        <Funnel
          actual={funnelMostrado}
          anterior={funnelComparacion}
          cuello={insight.cuello}
        />
      </section>

      {/* Timing */}
      <section className="bg-panel border border-line rounded-[12px] p-5 md:p-[26px] md:px-7 mb-5">
        <div className="flex items-baseline justify-between gap-3.5 mb-5">
          <h2
            className="font-display font-medium text-xl md:text-[22px] -tracking-[0.02em] leading-none text-ink text-balance"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Tiempo en <em className="italic text-violeta font-medium">cada etapa</em>
          </h2>
          <div className="text-[12px] text-muted hidden md:block">
            Cuánto tarda un lead en pasar de una etapa a la siguiente
          </div>
        </div>
        <TimingStrip timing={timing} cuello={insight.cuello} />
      </section>

      {/* Trend */}
      <section className="bg-panel border border-line rounded-[12px] p-5 md:p-[26px] md:px-7">
        <div className="flex items-baseline justify-between gap-3.5 mb-5">
          <h2
            className="font-display font-medium text-xl md:text-[22px] -tracking-[0.02em] leading-none text-ink text-balance"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Tendencia de{" "}
            <em className="italic text-violeta font-medium">3 meses</em>
          </h2>
          <div className="text-[12px] text-muted hidden md:block">
            Creados vs ganados por mes
          </div>
        </div>
        <TrendChart data={trend} />
      </section>
    </DashboardLayout>
  );
}

// Suma 3 meses (actual + 2 anteriores) para el período "trimestre".
async function getFunnelTrimestre(): Promise<FunnelData> {
  const meses = await Promise.all([0, 1, 2].map((m) => getFunnelData(m)));
  return meses.reduce<FunnelData>(
    (acc, m) => ({
      nuevos_total: acc.nuevos_total + m.nuevos_total,
      conversacion_acum: acc.conversacion_acum + m.conversacion_acum,
      propuesta_acum: acc.propuesta_acum + m.propuesta_acum,
      cierre_acum: acc.cierre_acum + m.cierre_acum,
      ganados: acc.ganados + m.ganados,
      valor_ganado: acc.valor_ganado + m.valor_ganado,
    }),
    {
      nuevos_total: 0,
      conversacion_acum: 0,
      propuesta_acum: 0,
      cierre_acum: 0,
      ganados: 0,
      valor_ganado: 0,
    },
  );
}

// Delta % entre dos valores. Si el anterior es 0, devuelve null (no se
// puede calcular delta).
function pct(
  actual: number,
  anterior: number,
): { value: string; direction: "up" | "down" | "neutral" } | null {
  if (anterior === 0) return null;
  const diff = ((actual - anterior) / anterior) * 100;
  const rounded = Math.round(diff);
  return {
    value: rounded === 0 ? "0%" : `${rounded > 0 ? "+" : ""}${rounded}%`,
    direction: rounded > 0 ? "up" : rounded < 0 ? "down" : "neutral",
  };
}
