import { AgendaTrigger } from "@/components/AgendaTrigger";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { KpiStripCierre } from "@/components/cerrados/KpiStripCierre";
import { LeadRowGanado } from "@/components/cerrados/LeadRowGanado";
import { LeadRowPerdido } from "@/components/cerrados/LeadRowPerdido";
import { MotivosStrip } from "@/components/cerrados/MotivosStrip";
import { PeriodSelectorCerrados } from "@/components/cerrados/PeriodSelectorCerrados";
import { RankingComerciales } from "@/components/cerrados/RankingComerciales";
import { SeccionAcordeon } from "@/components/cerrados/SeccionAcordeon";
import { NuevoLeadTrigger } from "@/components/NuevoLeadLauncher";
import { getCurrentUser } from "@/lib/auth";
import {
  computeCerradosKpis,
  getAgendaDia,
  getFunnelData,
  getGanadosMes,
  getMetaMes,
  getMotivosPerdidaMes,
  getPatronesActivosCount,
  getPerdidosMes,
  getPipelineResumen,
  getRankingCierres,
} from "@/lib/queries";

export default async function CerradosPage() {
  let data;
  try {
    const [
      currentUser,
      ganados,
      perdidos,
      ranking,
      motivos,
      meta,
      funnelActual,
      funnelAnterior,
      pipeline,
      agendaEvents,
      patronesCount,
    ] = await Promise.all([
      getCurrentUser(),
      getGanadosMes(),
      getPerdidosMes(),
      getRankingCierres(),
      getMotivosPerdidaMes(),
      getMetaMes(),
      getFunnelData(0),
      getFunnelData(1),
      getPipelineResumen(),
      getAgendaDia(),
      getPatronesActivosCount(),
    ]);
    data = {
      currentUser,
      ganados,
      perdidos,
      ranking,
      motivos,
      meta,
      funnelActual,
      funnelAnterior,
      pipeline,
      agendaEvents,
      patronesCount,
    };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar los cerrados"
        mensaje="Probablemente la base de datos local no está corriendo o las vistas del mes no fueron creadas."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const {
    currentUser,
    ganados,
    perdidos,
    ranking,
    motivos,
    meta,
    funnelActual,
    funnelAnterior,
    pipeline,
    agendaEvents,
    patronesCount,
  } = data;

  const kpis = computeCerradosKpis(
    ganados,
    perdidos,
    funnelActual,
    funnelAnterior,
    meta,
  );

  // Sidebar count: ganados + perdidos del mes (= cerrados totales).
  const cerradosMes = ganados.length + perdidos.length;

  const sidebarCounts = {
    nuevos: pipeline.find((p) => p.estado === "nuevo")?.cantidad ?? 0,
    conversacion:
      pipeline.find((p) => p.estado === "conversacion")?.cantidad ?? 0,
    propuesta: pipeline.find((p) => p.estado === "propuesta")?.cantidad ?? 0,
    ganados: pipeline.find((p) => p.estado === "ganado")?.cantidad ?? null,
    cerrados: cerradosMes,
    agenda: agendaEvents.length,
    patrones: patronesCount,
  };

  // Resumen del header de "Lo ganado": mejor cierre del mes.
  const mejorCierre = ranking[0];
  const summaryGanado = mejorCierre && mejorCierre.valor_total > 0 ? (
    <>
      Mejor cierre:{" "}
      <strong className="text-ink font-semibold">
        {mejorCierre.nombre.split(" ")[0]} con USD{" "}
        {mejorCierre.valor_total.toLocaleString("es-AR")}
      </strong>
    </>
  ) : null;

  // Resumen del header de "Lo perdido": motivo principal.
  const motivoPrincipal = motivos[0];
  const summaryPerdido = motivoPrincipal ? (
    <>
      Principal motivo:{" "}
      <strong className="text-ink font-semibold">
        {capitalize(motivoPrincipal.motivo)} ({motivoPrincipal.cantidad} de{" "}
        {kpis.perdidos_cantidad})
      </strong>
    </>
  ) : null;

  const eyebrowMes = monthLabel();
  const totalMonto = kpis.valor_cerrado;

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={sidebarCounts}
      currentUser={currentUser}
    >
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mb-7">
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
            Cerrados · {eyebrowMes}
          </div>
          <h1
            className="font-display text-[26px] md:text-[30px] xl:text-[36px] font-medium leading-[1.05] -tracking-[0.025em] text-ink mb-2.5 text-balance"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Lo que{" "}
            <em className="italic text-verde font-medium">cerraste</em>{" "}
            este mes.
          </h1>
          <p className="text-[12.5px] md:text-[13.5px] text-muted">
            Resultados finales · {kpis.ganados_cantidad} ganados,{" "}
            {kpis.perdidos_cantidad} perdidos · meta del mes{" "}
            <strong className="text-ink font-semibold">
              USD {meta.valor.toLocaleString("es-AR")}
            </strong>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodSelectorCerrados />
          <div className="flex items-center gap-2 lg:hidden">
            <AgendaTrigger count={agendaEvents.length} />
            <NuevoLeadTrigger />
          </div>
        </div>
      </header>

      <KpiStripCierre kpis={kpis} meta={meta} />

      {/* Empty state global */}
      {ganados.length === 0 && perdidos.length === 0 ? (
        <div className="bg-panel border border-line rounded-lg px-5 py-10 text-center">
          <div className="font-display font-medium text-[18px] text-ink mb-1">
            Sin cierres este mes todavía
          </div>
          <div className="text-[13px] text-muted">
            Cuando confirmes un ganado o marques un perdido, va a aparecer acá.
          </div>
        </div>
      ) : (
        <>
          {/* Lo ganado — abierto por default */}
          <SeccionAcordeon
            title={
              <>
                Lo <em className="italic text-verde font-medium">ganado</em>
              </>
            }
            count={`${ganados.length} ${ganados.length === 1 ? "lead" : "leads"} · USD ${totalMonto.toLocaleString("es-AR")}`}
            summary={summaryGanado}
            defaultOpen
          >
            {ganados.length === 0 ? (
              <div className="py-8 text-[13px] text-muted text-center">
                Aún no hay cierres este mes. El primero llega pronto.
              </div>
            ) : (
              <>
                <RankingComerciales ranking={ranking} />
                <div className="border-t border-line-2 mt-2">
                  {ganados.map((g, i) => (
                    <LeadRowGanado
                      key={g.id}
                      lead={g}
                      esUltimo={i === ganados.length - 1}
                    />
                  ))}
                </div>
              </>
            )}
          </SeccionAcordeon>

          {/* Lo perdido — solo si hay perdidos. */}
          {perdidos.length > 0 ? (
            <SeccionAcordeon
              title={
                <>
                  Lo <em className="italic text-rojo font-medium">perdido</em>
                </>
              }
              count={`${perdidos.length} ${perdidos.length === 1 ? "lead" : "leads"} · USD ${kpis.valor_perdido.toLocaleString("es-AR")}`}
              summary={summaryPerdido}
            >
              <MotivosStrip motivos={motivos} />
              <div className="border-t border-line-2 mt-2">
                {perdidos.map((p, i) => (
                  <LeadRowPerdido
                    key={p.id}
                    lead={p}
                    esUltimo={i === perdidos.length - 1}
                  />
                ))}
              </div>
            </SeccionAcordeon>
          ) : (
            <div className="bg-verde-soft border border-verde/30 rounded-[12px] px-5 py-5 md:px-[26px] flex items-center gap-3 text-verde text-[13.5px] font-semibold">
              Sin pérdidas este mes
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

function monthLabel(): string {
  const ahora = new Date();
  const mes = ahora.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
