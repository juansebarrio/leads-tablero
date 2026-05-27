import { DashboardLayout } from "@/components/DashboardLayout";
import { ComercialCard } from "@/components/equipo/ComercialCard";
import { GlobalMetrics } from "@/components/equipo/GlobalMetrics";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { formatMesAnio, formatUSD } from "@/lib/format";
import { getCurrentUser } from "@/lib/auth";
import {
  getAgendaDia,
  getComercialesConMetricas,
  getEquipoMetricas,
  getLeadsFrios,
  getLeadsParaKanban,
  getPatronesActivosCount,
  getPipelineResumen,
} from "@/lib/queries";

export default async function EquipoPage() {
  let datos;
  try {
    const [
      currentUser,
      comerciales,
      equipoMetricas,
      pipeline,
      frios,
      agendaEvents,
      leadsKanban,
      patronesCount,
    ] = await Promise.all([
      getCurrentUser(),
      getComercialesConMetricas(),
      getEquipoMetricas(),
      getPipelineResumen(),
      getLeadsFrios(),
      getAgendaDia(),
      getLeadsParaKanban(),
      getPatronesActivosCount(),
    ]);
    datos = {
      currentUser,
      comerciales,
      equipoMetricas,
      pipeline,
      frios,
      agendaEvents,
      leadsKanban,
      patronesCount,
    };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar el equipo"
        mensaje="Probablemente la base de datos local no está corriendo o faltan las variables de entorno."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const {
    currentUser,
    comerciales,
    equipoMetricas,
    pipeline,
    frios,
    agendaEvents,
    leadsKanban,
    patronesCount,
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

  // Días restantes hasta fin del mes (para el sub de la barra de meta).
  const ahora = new Date();
  const ultimoDelMes = new Date(
    ahora.getFullYear(),
    ahora.getMonth() + 1,
    0,
  ).getDate();
  const diasRestantes = Math.max(0, ultimoDelMes - ahora.getDate());

  const eyebrowMes = formatMesAnio(ahora);

  // Meta del equipo: suma de metas individuales.
  const metaEquipo = comerciales.reduce((acc, c) => acc + c.meta_mensual, 0);

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={{ valor: 51000, porcentaje: 68, diasRestantes: 6, meta: 75000 }}
      currentUser={currentUser}
    >
      <header className="mb-7">
        <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
          Equipo · {eyebrowMes}
        </div>
        <h1
          className="font-display text-[26px] md:text-[30px] xl:text-[36px] font-medium leading-[1.05] -tracking-[0.025em] text-ink mb-2.5 text-balance"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          Cómo viene <em className="italic text-violeta font-medium">el equipo</em>.
        </h1>
        <div className="text-[12.5px] md:text-[13.5px] text-muted">
          {comerciales.length}{" "}
          {comerciales.length === 1 ? "comercial activo" : "comerciales activos"}{" "}
          · Meta del mes:{" "}
          <strong className="text-ink font-semibold">{formatUSD(metaEquipo)}</strong>{" "}
          en ganados
        </div>
      </header>

      <GlobalMetrics metricas={equipoMetricas} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 md:gap-4">
        {comerciales.map((c) => (
          <ComercialCard
            key={c.id}
            comercial={c}
            diasRestantes={diasRestantes}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}

