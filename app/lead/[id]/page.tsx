import { ArrowLeft, Calendar, Mail, MessageCircle, Phone, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ErrorView, PasosConfigSupabase } from "@/components/ErrorView";
import {
  getAgendaDia,
  getLeadConDetalle,
  getLeadsFrios,
  getPipelineResumen,
  getPrimerPatronIa,
} from "@/lib/queries";
import { formatDuracion, formatHora, formatUSD } from "@/lib/format";
import type {
  CanalContacto,
  Contacto,
  EstadoOportunidad,
  EventoAgenda,
  LeadDetalle,
  Origen,
  TipoNegocio,
} from "@/lib/types";

const ORIGEN_LABEL: Record<Origen, string> = {
  formulario: "Formulario",
  referido: "Referido",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
};

const TIPO_LABEL: Record<TipoNegocio, string> = {
  recurrente: "Recurrente",
  proyecto: "Proyecto",
};

const HEAT_LABEL: Record<EstadoOportunidad, string> = {
  caliente: "Caliente",
  esperando_firma: "Esperando firma",
  por_reactivar: "Por reactivar",
  sin_asignar: "Sin asignar",
};

const HEAT_STYLE: Record<EstadoOportunidad, { bg: string; color: string }> = {
  caliente: { bg: "bg-rojo-soft", color: "text-rojo" },
  esperando_firma: { bg: "bg-amarillo-soft", color: "text-amarillo" },
  por_reactivar: { bg: "bg-violeta-soft", color: "text-violeta" },
  sin_asignar: { bg: "bg-turquesa-soft", color: "text-[#2E8FA8]" },
};

const CANAL_LABEL: Record<CanalContacto, string> = {
  mail: "Mail",
  llamado: "Llamado",
  whatsapp: "WhatsApp",
  reunion: "Reunión",
  linkedin: "LinkedIn",
};

const CANAL_ICON: Record<CanalContacto, typeof Mail> = {
  mail: Mail,
  llamado: Phone,
  whatsapp: MessageCircle,
  reunion: Users,
  linkedin: Users,
};

interface Params {
  id: string;
}

export default async function LeadPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  // El chrome (sidebar + agenda) usa los mismos datos del tablero, así la
  // navegación se ve consistente. Hacemos todo en paralelo con el detalle.
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

  return (
    <DashboardLayout
      agendaEvents={agendaEvents}
      sidebarCounts={counts}
      cierreMes={{ valor: 51000, porcentaje: 68, diasRestantes: 6, meta: 75000 }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-ink mb-5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
        Volver al tablero
      </Link>

      <LeadHero lead={lead} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <Datos lead={lead} />
        <ProximoPaso lead={lead} />
        <Responsable lead={lead} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <HistorialContactos contactos={lead.contactos} />
        <AgendaRelacionada eventos={lead.agendaRelacionada} />
      </div>
    </DashboardLayout>
  );
}

function LeadHero({ lead }: { lead: LeadDetalle }) {
  const heat = lead.estado_oportunidad;
  return (
    <div className="mb-7">
      <div className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">
        {ORIGEN_LABEL[lead.origen]}
        {lead.origen_detalle && (
          <span className="text-muted-2 normal-case font-normal tracking-normal ml-2">
            · {lead.origen_detalle}
          </span>
        )}
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1
          className="font-display text-3xl md:text-4xl font-medium tracking-tight text-ink leading-tight"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          {lead.nombre}
        </h1>
        {heat && (
          <span
            className={`self-start text-[10.5px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap ${HEAT_STYLE[heat].bg} ${HEAT_STYLE[heat].color}`}
          >
            {HEAT_LABEL[heat]}
          </span>
        )}
      </div>
    </div>
  );
}

function Datos({ lead }: { lead: LeadDetalle }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-5">
      <div className="text-[10.5px] text-muted tracking-[0.06em] uppercase font-semibold mb-3">
        Datos del lead
      </div>
      <Field
        label="Valor estimado"
        value={
          <span className="font-display font-semibold text-xl text-ink -tracking-[0.01em]">
            {formatUSD(lead.valor_estimado)}
          </span>
        }
      />
      <Field
        label="Tipo de negocio"
        value={
          <span>
            {TIPO_LABEL[lead.tipo_negocio]}
            {lead.tipo_negocio === "recurrente" && lead.meses_compromiso && (
              <span className="text-muted ml-1.5">
                · {lead.meses_compromiso} meses
              </span>
            )}
          </span>
        }
      />
      <Field
        label="Estado"
        value={<span className="capitalize">{lead.estado}</span>}
      />
      <Field
        label="Creado"
        value={formatFechaHumano(lead.fecha_creacion)}
        last
      />
    </div>
  );
}

function ProximoPaso({ lead }: { lead: LeadDetalle }) {
  return (
    <div className="bg-panel border border-line rounded-lg p-5 flex flex-col">
      <div className="text-[10.5px] text-muted tracking-[0.06em] uppercase font-semibold mb-3">
        Próximo paso
      </div>
      {lead.proximo_paso ? (
        <>
          <p className="text-[14px] text-ink font-medium leading-snug mb-3 flex-1">
            {lead.proximo_paso}
          </p>
          {lead.proximo_paso_fecha && (
            <div className="text-[12px] text-muted">
              {formatFechaHumano(lead.proximo_paso_fecha)} ·{" "}
              {formatHora(lead.proximo_paso_fecha)}
            </div>
          )}
        </>
      ) : (
        <p className="text-[13px] text-muted flex-1">Sin próximo paso definido.</p>
      )}
    </div>
  );
}

function Responsable({ lead }: { lead: LeadDetalle }) {
  const c = lead.comerciales;
  return (
    <div className="bg-panel border border-line rounded-lg p-5 flex flex-col">
      <div className="text-[10.5px] text-muted tracking-[0.06em] uppercase font-semibold mb-3">
        Responsable
      </div>
      {c ? (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-[13px]"
            style={{ background: c.avatar_gradient }}
          >
            {c.iniciales}
          </div>
          <div>
            <div className="font-semibold text-ink text-[14px]">{c.nombre}</div>
            <div className="text-[12px] text-muted">{c.email}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted bg-line border border-dashed border-muted-2 font-semibold text-[13px]">
            ?
          </div>
          <div>
            <div className="font-semibold text-ink-2 text-[14px]">
              Sin asignar
            </div>
            <div className="text-[12px] text-muted">
              Asignar para empezar a moverlo.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistorialContactos({ contactos }: { contactos: Contacto[] }) {
  return (
    <section>
      <h2
        className="font-display font-medium text-xl -tracking-[0.02em] text-ink mb-3"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        Historial de <em className="italic text-violeta font-medium">contactos</em>
      </h2>
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        {contactos.length === 0 && (
          <div className="text-[13px] text-muted px-5 py-6">
            Todavía no hay contactos registrados.
          </div>
        )}
        {contactos.map((c, i) => {
          const Icon = CANAL_ICON[c.canal];
          return (
            <div
              key={c.id}
              className={`flex gap-3 items-start px-5 py-3.5 ${i < contactos.length - 1 ? "border-b border-line-2" : ""}`}
            >
              <div className="mt-0.5 w-7 h-7 rounded-full bg-violeta-soft flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-violeta" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-semibold text-ink">
                    {CANAL_LABEL[c.canal]}
                  </span>
                  <span className="text-[11px] text-muted whitespace-nowrap">
                    {formatFechaHumano(c.fecha)}
                  </span>
                </div>
                {c.nota && (
                  <div className="text-[12.5px] text-ink-2 mt-1 leading-snug">
                    {c.nota}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AgendaRelacionada({ eventos }: { eventos: EventoAgenda[] }) {
  return (
    <section>
      <h2
        className="font-display font-medium text-xl -tracking-[0.02em] text-ink mb-3"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        En <em className="italic text-violeta font-medium">agenda</em>
      </h2>
      <div className="bg-panel border border-line rounded-lg overflow-hidden">
        {eventos.length === 0 && (
          <div className="text-[13px] text-muted px-5 py-6">
            Sin eventos agendados con este lead.
          </div>
        )}
        {eventos.map((e, i) => (
          <div
            key={e.id}
            className={`flex gap-3 items-start px-5 py-3.5 ${i < eventos.length - 1 ? "border-b border-line-2" : ""}`}
          >
            <div className="mt-0.5 w-7 h-7 rounded-full bg-violeta-soft flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 text-violeta" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-semibold text-ink">
                {e.titulo}
              </div>
              <div className="text-[11px] text-muted mt-0.5">
                {formatFechaHumano(e.fecha)} · {formatHora(e.fecha)} ·{" "}
                {formatDuracion(e.duracion_min)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  last = false,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-2.5 ${last ? "" : "border-b border-line-2"}`}
    >
      <span className="text-[11.5px] text-muted">{label}</span>
      <span className="text-[13px] text-ink-2 text-right">{value}</span>
    </div>
  );
}

// "25 de mayo" / "25 may 2025" si es de otro año
function formatFechaHumano(iso: string): string {
  const d = new Date(iso);
  const ahora = new Date();
  const mismoAnio = d.getFullYear() === ahora.getFullYear();
  return d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: mismoAnio ? "long" : "short",
    ...(mismoAnio ? {} : { year: "numeric" }),
  });
}
