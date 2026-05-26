import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import {
  getAgendaDia,
  getComerciales,
  getLeadsFrios,
  getLeadsParaKanban,
  getPipelineResumen,
  getPrimerPatronIa,
} from "@/lib/queries";

export default async function PipelinePage() {
  let datos;
  try {
    const [
      leadsKanban,
      comerciales,
      pipeline,
      frios,
      agendaEvents,
      patron,
    ] = await Promise.all([
      getLeadsParaKanban(),
      getComerciales(),
      getPipelineResumen(),
      getLeadsFrios(),
      getAgendaDia(),
      getPrimerPatronIa(),
    ]);
    datos = { leadsKanban, comerciales, pipeline, frios, agendaEvents, patron };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar el pipeline"
        mensaje="Probablemente la base de datos local no está corriendo o faltan las variables de entorno."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const { leadsKanban, comerciales, pipeline, frios, agendaEvents, patron } =
    datos;

  const counts = {
    atenderHoy: frios.length,
    agenda: agendaEvents.length,
    pipeline: leadsKanban.length,
    nuevos: pipeline.find((p) => p.estado === "nuevo")?.cantidad ?? 0,
    conversacion:
      pipeline.find((p) => p.estado === "conversacion")?.cantidad ?? 0,
    propuesta: pipeline.find((p) => p.estado === "propuesta")?.cantidad ?? 0,
    ganados: pipeline.find((p) => p.estado === "ganado")?.cantidad ?? null,
    patrones: patron ? 1 : 0,
  };

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={{ valor: 51000, porcentaje: 68, diasRestantes: 6, meta: 75000 }}
      // El board maneja su propio padding (necesita full-width para scroll
      // horizontal en tablet/mobile).
      mainClassName="pt-5 md:pt-7 pb-16 min-w-0 lg:px-8 lg:py-7"
    >
      <PipelineBoard initialLeads={leadsKanban} comerciales={comerciales} />
    </DashboardLayout>
  );
}
