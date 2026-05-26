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
  meta_mensual: number;
};

// Devuelto por v_comerciales_metricas.
export type ComercialConMetricas = Comercial & {
  leads_activos: number;
  pipeline_valor: number;
  ganados_mes_cantidad: number;
  ganados_mes_valor: number;
  ratio_cierre: number; // 0-100
  leads_frios: number;
};

// Sumas globales del equipo (calculadas en JS desde los comerciales).
export type EquipoMetricas = {
  leads_activos: number;
  pipeline_valor: number;
  ganados_mes_cantidad: number;
  ganados_mes_valor: number;
  ratio_cierre: number;
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
  metadata?: Record<string, unknown>;
};

// Devuelto por v_leads_kanban.
export type LeadKanban = LeadConComercial & {
  dias_en_estado: number;
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

// /conversion

export type FunnelData = {
  nuevos_total: number;
  conversacion_acum: number;
  propuesta_acum: number;
  cierre_acum: number;
  ganados: number;
  valor_ganado: number;
};

export type TimingItem = {
  estado_from: string; // 'inicio' | 'nuevo' | 'conversacion' | 'propuesta' | 'cierre'
  estado_to: string; // 'conversacion' | 'propuesta' | 'cierre' | 'ganado'
  cantidad_transiciones: number;
  dias_promedio: number;
};

export type TrendPoint = {
  meses_atras: number;
  mes: string; // ISO date "2026-05-01T00:00:00..."
  creados: number;
  ganados: number;
};

export type PeriodoConversion = "mes_actual" | "mes_anterior" | "trimestre";
