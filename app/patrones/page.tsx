import { AgendaTrigger } from "@/components/AgendaTrigger";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { NuevoLeadTrigger } from "@/components/NuevoLeadLauncher";
import { PatronCard } from "@/components/patrones/PatronCard";
import { PatronesFilters } from "@/components/patrones/PatronesFilters";
import { PatronesList } from "@/components/patrones/PatronesList";
import { PatronesStats } from "@/components/patrones/PatronesStats";
import { getCurrentUser } from "@/lib/auth";
import { detectarPatrones } from "@/lib/patrones-detectores";
import {
  getAgendaDia,
  getLeadsAfectados,
  getPatrones,
  getPatronesActivosCount,
  getPatronesStats,
  getPipelineResumen,
} from "@/lib/queries";
import type { PatronTipo } from "@/lib/types";

const TIPOS: PatronTipo[] = [
  "operativo",
  "atasco",
  "oportunidad",
  "tendencia",
  "sugerencia",
];

export default async function PatronesPage() {
  // Detección on-demand al entrar. Si falla algún detector, queda logueado
  // y seguimos: la pantalla muestra lo que haya en la tabla.
  try {
    await detectarPatrones();
  } catch (err) {
    console.warn("[patrones] detectarPatrones falló:", err);
  }

  let data;
  try {
    const [
      currentUser,
      patrones,
      stats,
      patronesCount,
      pipeline,
      agendaEvents,
    ] = await Promise.all([
      getCurrentUser(),
      getPatrones(),
      getPatronesStats(),
      getPatronesActivosCount(),
      getPipelineResumen(),
      getAgendaDia(),
    ]);
    const idsTodos = Array.from(
      new Set(patrones.flatMap((p) => p.leads_afectados)),
    );
    const afectados = await getLeadsAfectados(idsTodos);
    const afectadosPorId = new Map(afectados.map((a) => [a.id, a]));
    data = {
      currentUser,
      patrones,
      stats,
      patronesCount,
      pipeline,
      agendaEvents,
      afectadosPorId,
    };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar los patrones"
        mensaje="Probablemente la base de datos local no está corriendo o la tabla de patrones no fue creada."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const {
    currentUser,
    patrones,
    stats,
    patronesCount,
    pipeline,
    agendaEvents,
    afectadosPorId,
  } = data;

  // Counts por tipo para los chips de filtro (todos los patrones, no filtrados).
  const countsPorTipo = TIPOS.reduce<Record<PatronTipo, number>>(
    (acc, t) => {
      acc[t] = patrones.filter((p) => p.tipo === t).length;
      return acc;
    },
    { operativo: 0, atasco: 0, oportunidad: 0, tendencia: 0, sugerencia: 0 },
  );

  const sidebarCounts = {
    nuevos: pipeline.find((p) => p.estado === "nuevo")?.cantidad ?? 0,
    conversacion:
      pipeline.find((p) => p.estado === "conversacion")?.cantidad ?? 0,
    propuesta: pipeline.find((p) => p.estado === "propuesta")?.cantidad ?? 0,
    ganados: pipeline.find((p) => p.estado === "ganado")?.cantidad ?? null,
    agenda: agendaEvents.length,
    patrones: patronesCount,
  };

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={sidebarCounts}
      currentUser={currentUser}
    >
      <header className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-[11px] font-semibold text-muted tracking-[0.08em] uppercase">
            Inteligencia · {monthLabel()}
          </span>
          <div className="flex items-center gap-2 lg:hidden">
            <AgendaTrigger count={agendaEvents.length} />
            <NuevoLeadTrigger />
          </div>
        </div>
        <h1
          className="font-display font-medium text-[28px] md:text-[36px] -tracking-[0.025em] leading-[1.05] text-ink mb-2"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          Lo que estamos <em className="italic text-violeta font-medium">viendo</em>.
        </h1>
        <p className="text-[13.5px] text-muted max-w-[640px]">
          El sistema cruza datos del pipeline, del equipo y del histórico para
          detectar cosas que la vista de día a día no muestra.
        </p>
      </header>

      <PatronesStats stats={stats} />

      <PatronesFilters counts={countsPorTipo} total={patrones.length} />

      {patrones.length === 0 ? (
        <div className="bg-panel border border-line rounded-lg px-5 py-10 text-center">
          <div className="font-display font-medium text-[18px] text-ink mb-1">
            Sin patrones detectados ahora
          </div>
          <div className="text-[13px] text-muted">
            Cuando aparezca algo que valga la pena revisar, va a aparecer acá.
          </div>
        </div>
      ) : (
        <PatronesList>
          {patrones.map((p) => (
            // El wrapper data-tipo permite que PatronesList (Client) filtre
            // por chip sin re-fetch.
            <div key={p.id} data-tipo={p.tipo}>
              <PatronCard
                patron={p}
                afectados={p.leads_afectados
                  .map((id) => afectadosPorId.get(id))
                  .filter((a): a is NonNullable<typeof a> => Boolean(a))}
              />
            </div>
          ))}
        </PatronesList>
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
