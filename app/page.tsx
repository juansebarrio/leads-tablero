import { AIInsight } from "@/components/AIInsight";
import { AgendaTrigger } from "@/components/AgendaTrigger";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { LeadsTable } from "@/components/LeadsTable";
import { NuevoLeadLauncher } from "@/components/NuevoLeadLauncher";
import { OpportunityCard } from "@/components/OpportunityCard";
import { PipelineBar } from "@/components/PipelineBar";
import { getCurrentUser } from "@/lib/auth";
import {
  getAgendaDia,
  getLeadsFrios,
  getOportunidadesDia,
  getPipelineResumen,
  getPrimerPatronIa,
} from "@/lib/queries";

// El tablero es Server Component. Todas las queries corren en paralelo.
// Sin caching explícito por ahora — el reset diario y el bajo volumen de
// tráfico no lo justifican; si pasa a ser caro, sumamos `cache: 'force-cache'`
// y revalidación por tag.
export default async function Page() {
  let data;
  try {
    const [currentUser, pipeline, frios, oportunidades, agendaEvents, patron] =
      await Promise.all([
        getCurrentUser(),
        getPipelineResumen(),
        getLeadsFrios(),
        getOportunidadesDia(),
        getAgendaDia(),
        getPrimerPatronIa(),
      ]);
    data = {
      currentUser,
      pipeline,
      frios,
      oportunidades,
      agendaEvents,
      patron,
    };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar el tablero"
        mensaje="Probablemente la base de datos local no está corriendo o faltan las variables de entorno."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const { currentUser, pipeline, frios, oportunidades, agendaEvents, patron } =
    data;

  const cantidadFrios = frios.length;
  const cantidadOportunidades = oportunidades.length;
  const cantidadAgenda = agendaEvents.length;

  const counts = {
    atenderHoy: cantidadFrios,
    agenda: cantidadAgenda,
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
      currentUser={currentUser}
    >
      <DashboardHero
        nombreComercial={currentUser.nombre.split(" ")[0]}
        cantidadFrios={cantidadFrios}
        cantidadReuniones={cantidadAgenda}
        agendaTrigger={<AgendaTrigger count={cantidadAgenda} />}
        nuevoLeadTrigger={<NuevoLeadLauncher />}
      />

      <PipelineBar data={pipeline} />

      {patron && <AIInsight pattern={patron} />}

      <section className="mb-9">
        <SectionHeader
          title="Leads que"
          em="se enfrían"
          count={Math.min(frios.length, 5)}
          total={frios.length}
        />
        <LeadsTable leads={frios} maxFilas={5} />
      </section>

      <section className="mb-9">
        <SectionHeader
          title="Oportunidades a"
          em="mover hoy"
          count={Math.min(oportunidades.length, 4)}
          total={cantidadOportunidades}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {oportunidades.slice(0, 4).map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
          {oportunidades.length === 0 && (
            <div className="md:col-span-2 text-[13px] text-muted py-4">
              No hay oportunidades para mover hoy.
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

function SectionHeader({
  title,
  em,
  count,
  total,
}: {
  title: string;
  em: string;
  count: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3.5 mb-3.5">
      <h2
        className="font-display font-medium text-xl md:text-[22px] -tracking-[0.02em] leading-none text-ink text-balance"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        {title}{" "}
        <em className="italic text-violeta font-medium">{em}</em>
      </h2>
      <div className="flex items-center gap-3.5 text-[12px] text-muted whitespace-nowrap">
        <span>
          {count} de {total}
        </span>
        <a className="text-ink font-semibold border-b border-ink hover:text-violeta hover:border-violeta cursor-pointer pb-px">
          Ver todos
        </a>
      </div>
    </div>
  );
}

