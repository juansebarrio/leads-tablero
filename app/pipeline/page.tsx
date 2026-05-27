import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getCurrentUser } from "@/lib/auth";
import {
  getAgendaDia,
  getCierreMesData,
  getComerciales,
  getLeadsFrios,
  getLeadsParaKanban,
  getPatronesActivosCount,
  getPipelineResumen,
} from "@/lib/queries";

interface SearchParams {
  comercial?: string;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialComercialId = params.comercial ?? null;

  let datos;
  try {
    const [
      currentUser,
      leadsKanban,
      comerciales,
      pipeline,
      frios,
      agendaEvents,
      patronesCount,
      cierreMes,
    ] = await Promise.all([
      getCurrentUser(),
      getLeadsParaKanban(),
      getComerciales(),
      getPipelineResumen(),
      getLeadsFrios(),
      getAgendaDia(),
      getPatronesActivosCount(),
      getCierreMesData(),
    ]);
    datos = {
      currentUser,
      leadsKanban,
      comerciales,
      pipeline,
      frios,
      agendaEvents,
      patronesCount,
      cierreMes,
    };
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

  const {
    currentUser,
    leadsKanban,
    comerciales,
    pipeline,
    frios,
    agendaEvents,
    patronesCount,
    cierreMes,
  } = datos;

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

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={cierreMes}
      currentUser={currentUser}
      // El board maneja su propio padding (necesita full-width para scroll
      // horizontal en tablet/mobile).
      mainClassName="pt-5 md:pt-7 pb-16 min-w-0 lg:px-8 lg:py-7"
    >
      <PipelineBoard
        initialLeads={leadsKanban}
        comerciales={comerciales}
        initialComercialId={initialComercialId}
      />
    </DashboardLayout>
  );
}
