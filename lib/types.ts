// Tipos compartidos del dominio. Reflejan el esquema SQL de
// supabase/migrations + los joins/cálculos de las vistas.
// Hasta que tengamos `pnpm db:types` corriendo, esta es la fuente de verdad.

export type Origen = "formulario" | "referido" | "linkedin" | "whatsapp";
export type Estado = "nuevo" | "conversacion" | "propuesta" | "cierre" | "ganado";
export type TipoNegocio = "recurrente" | "proyecto";
export type Temperatura = "hot" | "warm" | "med" | "cool";
export type EstadoOportunidad =
  | "caliente"
  | "esperando_firma"
  | "por_reactivar"
  | "sin_asignar";
export type CanalContacto =
  | "mail"
  | "llamado"
  | "whatsapp"
  | "reunion"
  | "linkedin";
export type Modalidad = "meet" | "zoom" | "whatsapp" | "presencial";
export type AgendaTag =
  | "cierre_semana"
  | "referido"
  | "propuesta"
  | "definitiva";

export type Comercial = {
  id: string;
  nombre: string;
  iniciales: string;
  avatar_gradient: string;
  email: string;
  creado_en: string;
};

export type Lead = {
  id: string;
  nombre: string;
  origen: Origen;
  origen_detalle: string | null;
  estado: Estado;
  valor_estimado: number;
  tipo_negocio: TipoNegocio;
  meses_compromiso: number | null;
  responsable_id: string | null;
  fecha_creacion: string;
  fecha_ultimo_contacto: string | null;
  proximo_paso: string | null;
  proximo_paso_fecha: string | null;
  temperatura: Temperatura;
  estado_oportunidad: EstadoOportunidad | null;
};

// Devuelto por v_leds_frios y v_oportunidades_dia (lead + comercial flattened).
export type LeadConComercial = Lead & {
  comercial_nombre: string | null;
  comercial_iniciales: string | null;
  comercial_avatar: string | null;
};

export type LeadFrio = LeadConComercial & {
  dias_frio: number;
};

export type OportunidadDia = LeadConComercial;

export type EventoAgenda = {
  id: string;
  lead_id: string | null;
  fecha: string;
  duracion_min: number;
  titulo: string;
  modalidad: Modalidad;
  tag: AgendaTag | null;
};

export type Contacto = {
  id: string;
  lead_id: string;
  fecha: string;
  canal: CanalContacto;
  nota: string | null;
};

// Devuelto por getLeadConDetalle.
export type LeadDetalle = Lead & {
  comerciales: Comercial | null;
  contactos: Contacto[];
  agendaRelacionada: EventoAgenda[];
};

export type PipelineEstado = {
  estado: Estado;
  cantidad: number;
  valor_total: number;
};

export type PatronIa = {
  patron: string;
  cantidad: number;
  lead_ids: string[];
  desde: string;
  hasta: string;
};
