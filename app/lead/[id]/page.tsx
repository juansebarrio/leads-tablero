import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import { EventosAgendaLead } from "@/components/EventosAgendaLead";
import { LeadActions } from "@/components/LeadActions";
import { LeadDataGrid } from "@/components/LeadDataGrid";
import { LeadHeader } from "@/components/LeadHeader";
import { NextStepBanner } from "@/components/NextStepBanner";
import { TimelineContactos } from "@/components/TimelineContactos";
import { formatFechaRelativa } from "@/lib/lead-utils";
import {
  getAgendaDia,
  getLeadConDetalle,
  getLeadsFrios,
  getPipelineResumen,
  getPrimerPatronIa,
} from "@/lib/queries";

interface Params {
  id: string;
}

export default async function LeadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let datos;
  try {
    const [lead, pipeline, frios, agendaEvents, patron] = await Promise.all([
      getLeadConDetalle(id),
      getPipelineResumen(),
      getLeadsFrios(),
      getAgendaDia(),
      getPrimerPatronIa(),
    ]);
    datos = { lead, pipeline, frios, agendaEvents, patron };
  } catch (err) {
    return (
      <ErrorView
        titulo="No pudimos"
        tituloEm="cargar el lead"
        mensaje="Probablemente la base de datos local no está corriendo o faltan las variables de entorno."
        pasos={<PasosConfigSupabase />}
        detalle={err}
      />
    );
  }

  const { lead, pipeline, frios, agendaEvents, patron } = datos;
  if (!lead) notFound();

  const counts = {
    atenderHoy: frios.length,
    agenda: agendaEvents.length,
    nuevos: pipeline.find((p) => p.estado === "nuevo")?.cantidad ?? 0,
    conversacion:
      pipeline.find((p) => p.estado === "conversacion")?.cantidad ?? 0,
    propuesta: pipeline.find((p) => p.estado === "propuesta")?.cantidad ?? 0,
    ganados: pipeline.find((p) => p.estado === "ganado")?.cantidad ?? null,
    patrones: patron ? 1 : 0,
  };

  const ultimoContactoTexto = lead.fecha_ultimo_contacto
    ? `último ${formatFechaRelativa(lead.fecha_ultimo_contacto)}`
    : "sin contactos todavía";

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={{ valor: 51000, porcentaje: 68, diasRestantes: 6, meta: 75000 }}
    >
      {/* Top row: breadcrumb + acciones */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted hover:text-ink px-2 py-1 -ml-2 rounded-md hover:bg-line-2 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Volver al tablero
        </Link>
        <LeadActions
          leadId={lead.id}
          estadoActual={lead.estado}
          agendaCount={agendaEvents.length}
        />
      </div>

      <LeadHeader lead={lead} />

      <LeadDataGrid lead={lead} />

      <NextStepBanner lead={lead} />

      <section className="mb-9">
        <div className="flex items-baseline justify-between gap-3.5 mb-4">
          <h2
            className="font-display font-medium text-[19px] md:text-[22px] -tracking-[0.02em] leading-none text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            Historial de{" "}
            <em className="italic text-violeta font-medium">contactos</em>
          </h2>
          <div className="text-[12px] text-muted whitespace-nowrap">
            {lead.contactos.length}{" "}
            {lead.contactos.length === 1 ? "contacto" : "contactos"} ·{" "}
            {ultimoContactoTexto}
          </div>
        </div>
        <TimelineContactos
          contactos={lead.contactos}
          responsable={lead.comerciales}
        />
      </section>

      <section className="mb-9">
        <div className="flex items-baseline justify-between gap-3.5 mb-4">
          <h2
            className="font-display font-medium text-[19px] md:text-[22px] -tracking-[0.02em] leading-none text-ink"
            style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
          >
            En <em className="italic text-violeta font-medium">agenda</em>
          </h2>
          <div className="text-[12px] text-muted whitespace-nowrap">
            {lead.agendaRelacionada.length}{" "}
            {lead.agendaRelacionada.length === 1
              ? "reunión próxima"
              : "reuniones próximas"}
          </div>
        </div>
        <EventosAgendaLead eventos={lead.agendaRelacionada} />
      </section>
    </DashboardLayout>
  );
}
