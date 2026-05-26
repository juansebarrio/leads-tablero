/**
 * Datos demo + función reset+seed compartida.
 *
 * Usada por:
 *  - `scripts/seed.ts` (CLI, vía `pnpm db:seed`)
 *  - `app/api/reset/route.ts` (HTTP, llamada por el cron diario de Vercel)
 *
 * Las fechas se calculan relativas a `now()` en cada corrida, así la demo
 * se ve fresca cada día sin tener que reescribir el seed.
 */

import { createServiceRoleClient } from "@/lib/supabase/service";

// ─── Helpers de fechas relativas ─────────────────────────────────────────────

function diasAtras(dias: number, hora?: number, minuto = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  if (hora !== undefined) d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

function diasAdelante(dias: number, hora?: number, minuto = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  if (hora !== undefined) d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

function hoyA(hora: number, minuto = 0): string {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

// ─── Datos ───────────────────────────────────────────────────────────────────

type Origen = "formulario" | "referido" | "linkedin" | "whatsapp";
type Estado = "nuevo" | "conversacion" | "propuesta" | "cierre" | "ganado";
type Tipo = "recurrente" | "proyecto";
type Temp = "hot" | "warm" | "med" | "cool";
type Oport = "caliente" | "esperando_firma" | "por_reactivar" | "sin_asignar";
type Canal = "mail" | "llamado" | "whatsapp" | "reunion" | "linkedin";
type Modalidad = "meet" | "zoom" | "whatsapp" | "presencial";
type AgendaTag = "cierre_semana" | "referido" | "propuesta" | "definitiva";

const COMERCIALES = [
  {
    nombre: "Mariana López",
    iniciales: "ML",
    email: "mariana@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #8B6FFF, #5DC7E0)",
  },
  {
    nombre: "Diego Tovar",
    iniciales: "DT",
    email: "diego@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #FF8AA0, #FFB088)",
  },
  {
    nombre: "Sofía Méndez",
    iniciales: "SM",
    email: "sofia@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #6B8CFF, #8B6FFF)",
  },
] as const;

type LeadSeed = {
  nombre: string;
  origen: Origen;
  origen_detalle?: string;
  estado: Estado;
  valor_estimado: number;
  tipo_negocio: Tipo;
  meses_compromiso?: number;
  responsable: "ML" | "DT" | "SM" | null;
  dias_creacion: number;
  dias_ultimo_contacto: number | null;
  proximo_paso?: string;
  proximo_paso_dias?: number; // días desde hoy (negativos = pasado)
  proximo_paso_hora?: number;
  temperatura: Temp;
  estado_oportunidad?: Oport;
};

// Mix sector-agnóstico: constructora, contable, clínica, agencia, inmobiliaria,
// consultora, startup, editorial, logística, gastronomía.
const LEADS: LeadSeed[] = [
  // Frios visibles del mockup (cierra la coherencia con el HTML de referencia)
  {
    nombre: "Constructora Aliaga",
    origen: "formulario",
    estado: "cierre",
    valor_estimado: 4800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "ML",
    dias_creacion: 28,
    dias_ultimo_contacto: 10,
    proximo_paso: "Llamado de cierre",
    proximo_paso_dias: 0,
    proximo_paso_hora: 16,
    temperatura: "hot",
    estado_oportunidad: "caliente",
  },
  {
    nombre: "Estudio Vázquez & Asoc.",
    origen: "referido",
    origen_detalle: "Por Aliaga",
    estado: "propuesta",
    valor_estimado: 3200,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 24,
    dias_ultimo_contacto: 9,
    proximo_paso: "Confirmar reunión postergada",
    proximo_paso_dias: 2,
    proximo_paso_hora: 11,
    temperatura: "med",
    estado_oportunidad: "por_reactivar",
  },
  {
    nombre: "Clínica Norte",
    origen: "linkedin",
    estado: "propuesta",
    valor_estimado: 7500,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 20,
    dias_ultimo_contacto: 7,
    proximo_paso: "Seguimiento contrato — Dra. Yáñez",
    proximo_paso_dias: 1,
    proximo_paso_hora: 14,
    temperatura: "warm",
    estado_oportunidad: "esperando_firma",
  },
  {
    nombre: "Agencia Mercurio",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 5400,
    tipo_negocio: "proyecto",
    responsable: null,
    dias_creacion: 7,
    dias_ultimo_contacto: 6,
    proximo_paso: "Asignar comercial",
    proximo_paso_dias: 0,
    proximo_paso_hora: 17,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Don Eduardo",
    origen: "whatsapp",
    origen_detalle: "Recomendado por su contador",
    estado: "conversacion",
    valor_estimado: 2100,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "ML",
    dias_creacion: 18,
    dias_ultimo_contacto: 5,
    proximo_paso: "Mandar cotización por WhatsApp",
    proximo_paso_dias: 0,
    proximo_paso_hora: 18,
    temperatura: "warm",
  },

  // Nuevos
  {
    nombre: "Talleres Pampa",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 1800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: null,
    dias_creacion: 5,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Editorial Tres Ríos",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 2400,
    tipo_negocio: "proyecto",
    responsable: null,
    dias_creacion: 4,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Inmobiliaria Punta Mogote",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 3600,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: null,
    dias_creacion: 3,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Café Almagro",
    origen: "whatsapp",
    estado: "nuevo",
    valor_estimado: 1200,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 2,
    dias_ultimo_contacto: 2,
    temperatura: "warm",
  },
  {
    nombre: "Estudio Rivas",
    origen: "referido",
    estado: "nuevo",
    valor_estimado: 2800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "DT",
    dias_creacion: 1,
    dias_ultimo_contacto: 1,
    temperatura: "warm",
  },

  // En conversación
  {
    nombre: "Consultora Sur",
    origen: "linkedin",
    estado: "conversacion",
    valor_estimado: 4200,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 14,
    dias_ultimo_contacto: 2,
    proximo_paso: "Agendar discovery",
    proximo_paso_dias: 3,
    proximo_paso_hora: 10,
    temperatura: "warm",
  },
  {
    nombre: "Logística Andina",
    origen: "referido",
    estado: "conversacion",
    valor_estimado: 6500,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 12,
    dias_ultimo_contacto: 3,
    proximo_paso: "Revisar alcance con socio",
    proximo_paso_dias: 4,
    temperatura: "warm",
  },
  {
    nombre: "Veterinaria Patagonia",
    origen: "formulario",
    estado: "conversacion",
    valor_estimado: 1900,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "SM",
    dias_creacion: 10,
    dias_ultimo_contacto: 1,
    proximo_paso: "Mandar referencias",
    proximo_paso_dias: 1,
    proximo_paso_hora: 15,
    temperatura: "warm",
  },
  {
    nombre: "Studio Arquitectos B+B",
    origen: "linkedin",
    estado: "conversacion",
    valor_estimado: 5200,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 16,
    dias_ultimo_contacto: 4,
    proximo_paso: "Llamado de seguimiento",
    proximo_paso_dias: 2,
    proximo_paso_hora: 12,
    temperatura: "med",
  },
  {
    nombre: "Panadería La Costa",
    origen: "whatsapp",
    estado: "conversacion",
    valor_estimado: 1100,
    tipo_negocio: "recurrente",
    meses_compromiso: 3,
    responsable: "SM",
    dias_creacion: 9,
    dias_ultimo_contacto: 2,
    proximo_paso: "Confirmar presupuesto",
    proximo_paso_dias: 1,
    temperatura: "warm",
  },
  {
    nombre: "Distribuidora Centro",
    origen: "referido",
    estado: "conversacion",
    valor_estimado: 3800,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 13,
    dias_ultimo_contacto: 6,
    proximo_paso: "Reenviar propuesta inicial",
    proximo_paso_dias: 0,
    proximo_paso_hora: 11,
    temperatura: "med",
    estado_oportunidad: "por_reactivar",
  },
  {
    nombre: "Gimnasio Atlas",
    origen: "linkedin",
    estado: "conversacion",
    valor_estimado: 2600,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "ML",
    dias_creacion: 11,
    dias_ultimo_contacto: 3,
    proximo_paso: "Demo del módulo de reservas",
    proximo_paso_dias: 5,
    proximo_paso_hora: 16,
    temperatura: "warm",
  },

  // Propuesta
  {
    nombre: "Contadora Pérez Aguirre",
    origen: "referido",
    estado: "propuesta",
    valor_estimado: 4100,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 22,
    dias_ultimo_contacto: 4,
    proximo_paso: "Responder dudas sobre alcance",
    proximo_paso_dias: 2,
    proximo_paso_hora: 10,
    temperatura: "warm",
  },
  {
    nombre: "Clínica Odontológica Vega",
    origen: "linkedin",
    estado: "propuesta",
    valor_estimado: 8200,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 26,
    dias_ultimo_contacto: 3,
    proximo_paso: "Revisión de propuesta — viernes",
    proximo_paso_dias: 4,
    proximo_paso_hora: 11,
    temperatura: "hot",
    estado_oportunidad: "caliente",
  },
  {
    nombre: "Inmobiliaria Faro",
    origen: "formulario",
    estado: "propuesta",
    valor_estimado: 5800,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 19,
    dias_ultimo_contacto: 8,
    proximo_paso: "Llamado de cierre — Marcelo",
    proximo_paso_dias: 1,
    proximo_paso_hora: 9,
    temperatura: "warm",
    estado_oportunidad: "esperando_firma",
  },
  {
    nombre: "Constructora Litoral",
    origen: "referido",
    estado: "propuesta",
    valor_estimado: 9400,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 30,
    dias_ultimo_contacto: 11,
    proximo_paso: "Revivir conversación",
    proximo_paso_dias: 0,
    proximo_paso_hora: 15,
    temperatura: "med",
    estado_oportunidad: "por_reactivar",
  },
  {
    nombre: "Agencia Caleidoscopio",
    origen: "linkedin",
    estado: "propuesta",
    valor_estimado: 6700,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 17,
    dias_ultimo_contacto: 2,
    proximo_paso: "Ajustar alcance y reenviar",
    proximo_paso_dias: 3,
    temperatura: "warm",
  },

  // Cierre
  {
    nombre: "Bodega del Valle",
    origen: "referido",
    estado: "cierre",
    valor_estimado: 7100,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 35,
    dias_ultimo_contacto: 1,
    proximo_paso: "Firma de contrato",
    proximo_paso_dias: 2,
    proximo_paso_hora: 11,
    temperatura: "hot",
    estado_oportunidad: "esperando_firma",
  },
  {
    nombre: "Centro Médico Belgrano",
    origen: "linkedin",
    estado: "cierre",
    valor_estimado: 9800,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 32,
    dias_ultimo_contacto: 2,
    proximo_paso: "Confirmar fecha de kickoff",
    proximo_paso_dias: 1,
    proximo_paso_hora: 16,
    temperatura: "hot",
    estado_oportunidad: "caliente",
  },
  {
    nombre: "Editorial Mar Adentro",
    origen: "formulario",
    estado: "cierre",
    valor_estimado: 4600,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 27,
    dias_ultimo_contacto: 3,
    proximo_paso: "Esperar OK del directorio",
    proximo_paso_dias: 5,
    temperatura: "warm",
    estado_oportunidad: "esperando_firma",
  },

  // Ganados
  {
    nombre: "Estudio Jurídico Maraví",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 3500,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 45,
    dias_ultimo_contacto: 5,
    temperatura: "warm",
  },
  {
    nombre: "Hotel Boutique San Telmo",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 6200,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 50,
    dias_ultimo_contacto: 8,
    temperatura: "warm",
  },
];

// Historial de contactos: 1 a 3 por lead según madurez.
function historialContactos(lead: LeadSeed, leadId: string) {
  const contactos: Array<{
    lead_id: string;
    fecha: string;
    canal: Canal;
    nota: string;
  }> = [];

  const canalDefault: Record<Origen, Canal> = {
    formulario: "mail",
    referido: "mail",
    linkedin: "linkedin",
    whatsapp: "whatsapp",
  };

  contactos.push({
    lead_id: leadId,
    fecha: diasAtras(lead.dias_creacion),
    canal: canalDefault[lead.origen],
    nota: "Primer contacto",
  });

  if (
    lead.dias_ultimo_contacto !== null &&
    lead.dias_ultimo_contacto < lead.dias_creacion
  ) {
    const intermedio = Math.floor(
      (lead.dias_creacion + lead.dias_ultimo_contacto) / 2,
    );
    if (intermedio > lead.dias_ultimo_contacto) {
      contactos.push({
        lead_id: leadId,
        fecha: diasAtras(intermedio),
        canal: "llamado",
        nota: "Seguimiento intermedio",
      });
    }
    contactos.push({
      lead_id: leadId,
      fecha: diasAtras(lead.dias_ultimo_contacto),
      canal: "mail",
      nota: "Último intercambio",
    });
  }

  return contactos;
}

// Agenda del día (matchea el mockup).
const AGENDA: Array<{
  titulo: string;
  hora: number;
  minuto: number;
  duracion_min: number;
  modalidad: Modalidad;
  tag: AgendaTag | null;
  leadNombre: string | null;
}> = [
  {
    titulo: "Primera reunión · Aliaga",
    hora: 10,
    minuto: 0,
    duracion_min: 30,
    modalidad: "meet",
    tag: "cierre_semana",
    leadNombre: "Constructora Aliaga",
  },
  {
    titulo: "Discovery · E. Vázquez",
    hora: 11,
    minuto: 30,
    duracion_min: 45,
    modalidad: "zoom",
    tag: "referido",
    leadNombre: "Estudio Vázquez & Asoc.",
  },
  {
    titulo: "Presentación · Clínica Norte",
    hora: 14,
    minuto: 0,
    duracion_min: 60,
    modalidad: "presencial",
    tag: "propuesta",
    leadNombre: "Clínica Norte",
  },
  {
    titulo: "Cierre · Aliaga",
    hora: 16,
    minuto: 30,
    duracion_min: 30,
    modalidad: "whatsapp",
    tag: "definitiva",
    leadNombre: "Constructora Aliaga",
  },
];

// ─── Reset + seed ────────────────────────────────────────────────────────────

export type SeedResult = {
  comerciales: number;
  leads: number;
  contactos: number;
  agenda: number;
};

export async function resetAndSeed(): Promise<SeedResult> {
  const supabase = createServiceRoleClient();

  // Borrado en orden inverso a las FKs.
  for (const tabla of ["contactos", "agenda", "leads", "comerciales"] as const) {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .not("id", "is", null);
    if (error) throw new Error(`Limpiando ${tabla}: ${error.message}`);
  }

  const { data: comInsertados, error: errCom } = await supabase
    .from("comerciales")
    .insert(COMERCIALES)
    .select();
  if (errCom || !comInsertados) {
    throw new Error(`Insertando comerciales: ${errCom?.message ?? "sin data"}`);
  }

  const porIni = (ini: "ML" | "DT" | "SM") =>
    comInsertados.find((c) => c.iniciales === ini)!.id;

  const leadsPayload = LEADS.map((l) => ({
    nombre: l.nombre,
    origen: l.origen,
    origen_detalle: l.origen_detalle ?? null,
    estado: l.estado,
    valor_estimado: l.valor_estimado,
    tipo_negocio: l.tipo_negocio,
    meses_compromiso: l.meses_compromiso ?? null,
    responsable_id: l.responsable ? porIni(l.responsable) : null,
    fecha_creacion: diasAtras(l.dias_creacion),
    fecha_ultimo_contacto:
      l.dias_ultimo_contacto !== null
        ? diasAtras(l.dias_ultimo_contacto)
        : null,
    proximo_paso: l.proximo_paso ?? null,
    proximo_paso_fecha:
      l.proximo_paso_dias !== undefined
        ? l.proximo_paso_dias === 0
          ? hoyA(l.proximo_paso_hora ?? 10)
          : diasAdelante(l.proximo_paso_dias, l.proximo_paso_hora)
        : null,
    temperatura: l.temperatura,
    estado_oportunidad: l.estado_oportunidad ?? null,
  }));

  const { data: leadsInsertados, error: errLeads } = await supabase
    .from("leads")
    .insert(leadsPayload)
    .select();
  if (errLeads || !leadsInsertados) {
    throw new Error(`Insertando leads: ${errLeads?.message ?? "sin data"}`);
  }

  const leadIdPorNombre = new Map(
    leadsInsertados.map((l) => [l.nombre, l.id]),
  );

  const contactos = LEADS.flatMap((l) => {
    const id = leadIdPorNombre.get(l.nombre);
    if (!id) return [];
    return historialContactos(l, id);
  });

  // El trigger usa greatest(), no pisa la fecha que ya pusimos en cada lead.
  const { error: errContactos } = await supabase
    .from("contactos")
    .insert(contactos);
  if (errContactos) {
    throw new Error(`Insertando contactos: ${errContactos.message}`);
  }

  const agendaPayload = AGENDA.map((e) => ({
    lead_id: e.leadNombre ? leadIdPorNombre.get(e.leadNombre) ?? null : null,
    fecha: hoyA(e.hora, e.minuto),
    duracion_min: e.duracion_min,
    titulo: e.titulo,
    modalidad: e.modalidad,
    tag: e.tag,
  }));

  const { error: errAgenda } = await supabase
    .from("agenda")
    .insert(agendaPayload);
  if (errAgenda) {
    throw new Error(`Insertando agenda: ${errAgenda.message}`);
  }

  return {
    comerciales: comInsertados.length,
    leads: leadsInsertados.length,
    contactos: contactos.length,
    agenda: agendaPayload.length,
  };
}
