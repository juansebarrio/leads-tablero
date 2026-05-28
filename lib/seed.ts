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

import { DEMO_ORG_ID } from "@/lib/config";
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
type Estado =
  | "nuevo"
  | "conversacion"
  | "propuesta"
  | "cierre"
  | "ganado"
  | "perdido";
type MotivoPerdida =
  | "precio"
  | "timing"
  | "competencia"
  | "no_respondio"
  | "cambio_necesidad"
  | "otro";
type Tipo = "recurrente" | "proyecto";
type Temp = "hot" | "warm" | "med" | "cool";
type Oport = "caliente" | "esperando_firma" | "por_reactivar" | "sin_asignar";
type Canal =
  | "mail"
  | "llamado"
  | "whatsapp"
  | "reunion"
  | "linkedin"
  | "cambio_estado";
type Modalidad = "meet" | "zoom" | "whatsapp" | "presencial";
type AgendaTag = "cierre_semana" | "referido" | "propuesta" | "definitiva";

const COMERCIALES = [
  {
    nombre: "Mariana López",
    iniciales: "ML",
    email: "mariana@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #8B6FFF, #5DC7E0)",
    meta_mensual: 20000,
  },
  {
    nombre: "Diego Tovar",
    iniciales: "DT",
    email: "diego@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #FF8AA0, #FFB088)",
    meta_mensual: 25000,
  },
  {
    nombre: "Sofía Méndez",
    iniciales: "SM",
    email: "sofia@js80.studio",
    avatar_gradient: "linear-gradient(135deg, #6B8CFF, #8B6FFF)",
    meta_mensual: 15000,
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
  // Solo para estados terminales (ganado/perdido). Cierra el ciclo:
  // dias_cierre = cuántos días atrás se cerró (alimenta v_ganados_mes,
  // v_perdidos_mes y v_ranking_cierres_mes).
  dias_cierre?: number;
  valor_final?: number;          // solo ganados
  motivo_perdida?: MotivoPerdida; // solo perdidos
  detalle_perdida?: string;       // solo perdidos
  comentario_cierre?: string;     // ganados o perdidos
  // Para perdidos: estado en el que estaba antes de marcarse perdido.
  // Alimenta el "estaba en X" de v_perdidos_mes via cambio_estado.
  estado_previo?: "conversacion" | "propuesta" | "cierre";
  // Override de cuándo cayó el último cambio_estado (en días atrás).
  // Sin override, cambiosEstadoSimulados distribuye uniformemente entre
  // dias_creacion y hoy. Con override, el último salto cae acá — útil
  // para forzar que detectarAtascosEnEtapa encuentre 3 leads >+14 días
  // en propuesta sin tener que inflar dias_creacion.
  dias_en_estado_actual?: number;
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

  // ─── Ganados del mes ────────────────────────────────────────────
  // dias_cierre <= 25 garantiza que el lead caiga en el mes corriente
  // para alimentar v_ganados_mes y v_ranking_cierres_mes.
  {
    nombre: "Estudio Jurídico Maraví",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 3500,
    valor_final: 3800,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 45,
    dias_ultimo_contacto: 8,
    dias_cierre: 8,
    temperatura: "warm",
    comentario_cierre:
      "Cerramos por 12 meses con descuento del 8% por pago semestral.",
  },
  {
    nombre: "Hotel Boutique San Telmo",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 6200,
    valor_final: 7500,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 50,
    dias_ultimo_contacto: 14,
    dias_cierre: 14,
    temperatura: "warm",
    comentario_cierre: "Subieron el alcance al doble: sumaron 2 sucursales.",
  },
  {
    nombre: "Bodega del Valle",
    origen: "formulario",
    estado: "ganado",
    valor_estimado: 12000,
    valor_final: 14700,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 40,
    dias_ultimo_contacto: 5,
    dias_cierre: 5,
    temperatura: "hot",
  },
  {
    nombre: "Polo Logístico Sur",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 10000,
    valor_final: 12300,
    tipo_negocio: "recurrente",
    meses_compromiso: 24,
    responsable: "ML",
    dias_creacion: 38,
    dias_ultimo_contacto: 11,
    dias_cierre: 11,
    temperatura: "hot",
  },
  {
    nombre: "Centro Médico Sur",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 11500,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 28,
    dias_ultimo_contacto: 16,
    dias_cierre: 16,
    temperatura: "warm",
  },
  {
    nombre: "Distribuidora Centro",
    origen: "whatsapp",
    estado: "ganado",
    valor_estimado: 3800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "DT",
    dias_creacion: 12,
    dias_ultimo_contacto: 3,
    dias_cierre: 3,
    temperatura: "hot",
  },
  {
    nombre: "Inmobiliaria Faro",
    origen: "formulario",
    estado: "ganado",
    valor_estimado: 5800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "SM",
    dias_creacion: 22,
    dias_ultimo_contacto: 18,
    dias_cierre: 18,
    temperatura: "warm",
  },

  // ─── Perdidos del mes ───────────────────────────────────────────
  {
    nombre: "Constructora Litoral",
    origen: "linkedin",
    estado: "perdido",
    valor_estimado: 9400,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 35,
    dias_ultimo_contacto: 4,
    dias_cierre: 4,
    temperatura: "warm",
    motivo_perdida: "precio",
    detalle_perdida:
      "Pidió bajar 30% el precio, no aceptaron contraoferta. El director firmó con un proveedor más barato.",
    estado_previo: "cierre",
  },
  {
    nombre: "Agencia Mercurio Norte",
    origen: "formulario",
    estado: "perdido",
    valor_estimado: 4000,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 30,
    dias_ultimo_contacto: 10,
    dias_cierre: 10,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "El presupuesto se les fue de mano.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Mariella Eventos",
    origen: "referido",
    estado: "perdido",
    valor_estimado: 4800,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 25,
    dias_ultimo_contacto: 16,
    dias_cierre: 16,
    temperatura: "cool",
    motivo_perdida: "timing",
    detalle_perdida: "Postergó el proyecto para 2027.",
    estado_previo: "conversacion",
  },

  // ─── Industrias ampliadas: gastronomía, educativo, e-commerce,
  // ─── ONG, salud. Activos en distintos estados.
  {
    nombre: "Restaurante La Trastienda",
    origen: "whatsapp",
    estado: "conversacion",
    valor_estimado: 2800,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 10,
    dias_ultimo_contacto: 2,
    proximo_paso: "Cotización del menú degustación",
    proximo_paso_dias: 1,
    proximo_paso_hora: 11,
    temperatura: "warm",
  },
  {
    nombre: "Café Tortoni Sucursal",
    origen: "referido",
    estado: "propuesta",
    valor_estimado: 3600,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 16,
    dias_ultimo_contacto: 4,
    proximo_paso: "Revisar plano final con arquitecta",
    proximo_paso_dias: 3,
    temperatura: "warm",
  },
  {
    nombre: "Heladería Bardot",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 1400,
    tipo_negocio: "proyecto",
    responsable: null,
    dias_creacion: 2,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Colegio San Marcos",
    origen: "referido",
    estado: "conversacion",
    valor_estimado: 5400,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 11,
    dias_ultimo_contacto: 3,
    proximo_paso: "Reunión con dirección académica",
    proximo_paso_dias: 4,
    proximo_paso_hora: 9,
    temperatura: "warm",
  },
  {
    nombre: "Instituto de Idiomas Lingua",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 2200,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: null,
    dias_creacion: 3,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Academia de Música Bach",
    origen: "whatsapp",
    estado: "conversacion",
    valor_estimado: 1900,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "SM",
    dias_creacion: 7,
    dias_ultimo_contacto: 2,
    temperatura: "warm",
  },
  {
    nombre: "Tienda Online Casa Norte",
    origen: "formulario",
    estado: "propuesta",
    valor_estimado: 4200,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 14,
    dias_ultimo_contacto: 6,
    proximo_paso: "Pasar mockups finales",
    proximo_paso_dias: 2,
    temperatura: "warm",
  },
  {
    nombre: "Boutique Bahía Online",
    origen: "linkedin",
    estado: "conversacion",
    valor_estimado: 3100,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 9,
    dias_ultimo_contacto: 4,
    temperatura: "warm",
  },
  {
    nombre: "Almacén Digital",
    origen: "formulario",
    estado: "nuevo",
    valor_estimado: 1700,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: null,
    dias_creacion: 4,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Fundación Manos Unidas",
    origen: "referido",
    estado: "conversacion",
    valor_estimado: 2600,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 13,
    dias_ultimo_contacto: 5,
    proximo_paso: "Charla con junta directiva",
    proximo_paso_dias: 5,
    temperatura: "warm",
  },
  {
    nombre: "ONG Ríos Limpios",
    origen: "linkedin",
    estado: "nuevo",
    valor_estimado: 1500,
    tipo_negocio: "proyecto",
    responsable: null,
    dias_creacion: 5,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Centro Odontológico Avenida",
    origen: "formulario",
    estado: "propuesta",
    valor_estimado: 4900,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 18,
    dias_ultimo_contacto: 7,
    proximo_paso: "Mandar contrato revisado",
    proximo_paso_dias: 2,
    temperatura: "warm",
    estado_oportunidad: "esperando_firma",
  },
  {
    nombre: "Laboratorio del Bosque",
    origen: "referido",
    estado: "conversacion",
    valor_estimado: 6800,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 12,
    dias_ultimo_contacto: 4,
    temperatura: "warm",
  },

  // ─── LATAM (20% del total). En `origen_detalle` queda el país.
  {
    nombre: "Viña Maipo Tours",
    origen: "linkedin",
    origen_detalle: "Chile · Santiago",
    estado: "conversacion",
    valor_estimado: 5200,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 9,
    dias_ultimo_contacto: 3,
    proximo_paso: "Demo con director comercial",
    proximo_paso_dias: 4,
    temperatura: "warm",
  },
  {
    nombre: "Constructora Andes",
    origen: "referido",
    origen_detalle: "Chile · Valparaíso",
    estado: "propuesta",
    valor_estimado: 8400,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 22,
    dias_ultimo_contacto: 8,
    proximo_paso: "Revisar alcance con socio",
    proximo_paso_dias: 6,
    temperatura: "warm",
  },
  {
    nombre: "Pastelería Sur",
    origen: "formulario",
    origen_detalle: "Chile · Concepción",
    estado: "nuevo",
    valor_estimado: 1800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: null,
    dias_creacion: 4,
    dias_ultimo_contacto: null,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Estudio Jurídico Pocitos",
    origen: "referido",
    origen_detalle: "Uruguay · Montevideo",
    estado: "conversacion",
    valor_estimado: 3700,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 14,
    dias_ultimo_contacto: 5,
    temperatura: "warm",
  },
  {
    nombre: "Agroindustria Salto",
    origen: "linkedin",
    origen_detalle: "Uruguay · Salto",
    estado: "propuesta",
    valor_estimado: 7100,
    tipo_negocio: "recurrente",
    meses_compromiso: 24,
    responsable: "DT",
    dias_creacion: 19,
    dias_ultimo_contacto: 6,
    proximo_paso: "Llamado con gerente de operaciones",
    proximo_paso_dias: 3,
    temperatura: "hot",
    estado_oportunidad: "esperando_firma",
  },
  {
    nombre: "Despacho Contable Polanco",
    origen: "formulario",
    origen_detalle: "México · CDMX",
    estado: "conversacion",
    valor_estimado: 4400,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 11,
    dias_ultimo_contacto: 4,
    proximo_paso: "Enviar caso de éxito de Argentina",
    proximo_paso_dias: 2,
    temperatura: "warm",
  },
  {
    nombre: "Hotel Boutique Mérida",
    origen: "linkedin",
    origen_detalle: "México · Yucatán",
    estado: "propuesta",
    valor_estimado: 6900,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 17,
    dias_ultimo_contacto: 7,
    proximo_paso: "Ajustar propuesta con honorarios MXN",
    proximo_paso_dias: 4,
    temperatura: "warm",
  },
  {
    nombre: "Marca Roma Norte",
    origen: "referido",
    origen_detalle: "México · CDMX",
    estado: "nuevo",
    valor_estimado: 2900,
    tipo_negocio: "proyecto",
    responsable: null,
    dias_creacion: 6,
    dias_ultimo_contacto: 6,
    temperatura: "cool",
    estado_oportunidad: "sin_asignar",
  },
  {
    nombre: "Constructora Bogotá Centro",
    origen: "linkedin",
    origen_detalle: "Colombia · Bogotá",
    estado: "conversacion",
    valor_estimado: 5800,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 13,
    dias_ultimo_contacto: 5,
    temperatura: "warm",
  },
  {
    nombre: "Consultora Cali Norte",
    origen: "formulario",
    origen_detalle: "Colombia · Cali",
    estado: "cierre",
    valor_estimado: 4100,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 26,
    dias_ultimo_contacto: 3,
    proximo_paso: "Firma electrónica del contrato",
    proximo_paso_dias: 1,
    proximo_paso_hora: 15,
    temperatura: "hot",
    estado_oportunidad: "caliente",
  },

  // ─── 3 leads atascados en Propuesta (+14 días) para que el detector
  // ─── "atasco" tenga material que disparar.
  {
    nombre: "Polo Industrial Lanús",
    origen: "linkedin",
    estado: "propuesta",
    valor_estimado: 9800,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 38,
    dias_ultimo_contacto: 19,
    dias_en_estado_actual: 19,
    temperatura: "med",
    estado_oportunidad: "por_reactivar",
  },
  {
    nombre: "Frigorífico Sur",
    origen: "referido",
    estado: "propuesta",
    valor_estimado: 7400,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 34,
    dias_ultimo_contacto: 17,
    dias_en_estado_actual: 17,
    temperatura: "med",
    estado_oportunidad: "por_reactivar",
  },
  {
    nombre: "Bodegas Mendoza Premium",
    origen: "formulario",
    estado: "propuesta",
    valor_estimado: 6200,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 32,
    dias_ultimo_contacto: 16,
    dias_en_estado_actual: 16,
    temperatura: "med",
  },

  // ─── Históricos · ABRIL (entre 30 y 57 días atrás). 9 ganados (~58k)
  // ─── + 6 perdidos. Distribuidos entre ML/DT/SM.
  {
    nombre: "Estudio Galván & Soto",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 5400,
    valor_final: 6200,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 70,
    dias_ultimo_contacto: 33,
    dias_cierre: 33,
    temperatura: "warm",
    comentario_cierre: "Compromiso anual cerrado por convenio profesional.",
  },
  {
    nombre: "Inmobiliaria Río de la Plata",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 8200,
    valor_final: 9100,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 72,
    dias_ultimo_contacto: 36,
    dias_cierre: 36,
    temperatura: "warm",
  },
  {
    nombre: "Restó Las Cañitas",
    origen: "whatsapp",
    estado: "ganado",
    valor_estimado: 3400,
    valor_final: 3400,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 65,
    dias_ultimo_contacto: 41,
    dias_cierre: 41,
    temperatura: "warm",
  },
  {
    nombre: "Colegio del Pilar",
    origen: "formulario",
    estado: "ganado",
    valor_estimado: 6700,
    valor_final: 7500,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 78,
    dias_ultimo_contacto: 44,
    dias_cierre: 44,
    temperatura: "warm",
  },
  {
    nombre: "Logística Patagonia",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 11000,
    valor_final: 12400,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 75,
    dias_ultimo_contacto: 47,
    dias_cierre: 47,
    temperatura: "hot",
  },
  {
    nombre: "Clínica Veterinaria Sur",
    origen: "formulario",
    estado: "ganado",
    valor_estimado: 4900,
    valor_final: 4900,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "SM",
    dias_creacion: 60,
    dias_ultimo_contacto: 50,
    dias_cierre: 50,
    temperatura: "warm",
  },
  {
    nombre: "Consultora Andrade",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 5500,
    valor_final: 5500,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 68,
    dias_ultimo_contacto: 53,
    dias_cierre: 53,
    temperatura: "warm",
  },
  {
    nombre: "Distribuidora Costa",
    origen: "whatsapp",
    estado: "ganado",
    valor_estimado: 3800,
    valor_final: 4100,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "DT",
    dias_creacion: 56,
    dias_ultimo_contacto: 55,
    dias_cierre: 55,
    temperatura: "warm",
  },
  {
    nombre: "Hostería Bariloche",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 4200,
    valor_final: 4600,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 62,
    dias_ultimo_contacto: 57,
    dias_cierre: 57,
    temperatura: "warm",
  },
  {
    nombre: "Studio Creativo Sur",
    origen: "linkedin",
    estado: "perdido",
    valor_estimado: 5800,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 65,
    dias_ultimo_contacto: 35,
    dias_cierre: 35,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "Eligieron freelance individual por costo.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Reformas Express",
    origen: "formulario",
    estado: "perdido",
    valor_estimado: 4200,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 70,
    dias_ultimo_contacto: 40,
    dias_cierre: 40,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "Presupuesto fuera de lo que tenían pensado.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Veterinaria Almagro",
    origen: "whatsapp",
    estado: "perdido",
    valor_estimado: 2800,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "SM",
    dias_creacion: 58,
    dias_ultimo_contacto: 43,
    dias_cierre: 43,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "No tenían margen para abono mensual.",
    estado_previo: "conversacion",
  },
  {
    nombre: "Editorial Brisa",
    origen: "referido",
    estado: "perdido",
    valor_estimado: 3500,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 75,
    dias_ultimo_contacto: 48,
    dias_cierre: 48,
    temperatura: "cool",
    motivo_perdida: "timing",
    detalle_perdida: "Postergaron el lanzamiento del catálogo.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Estudio Jurídico Norte",
    origen: "linkedin",
    estado: "perdido",
    valor_estimado: 4900,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 80,
    dias_ultimo_contacto: 52,
    dias_cierre: 52,
    temperatura: "cool",
    motivo_perdida: "timing",
    detalle_perdida: "Esperan cierre del año fiscal.",
    estado_previo: "cierre",
  },
  {
    nombre: "Marketing Plus",
    origen: "formulario",
    estado: "perdido",
    valor_estimado: 3100,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 60,
    dias_ultimo_contacto: 55,
    dias_cierre: 55,
    temperatura: "cool",
    motivo_perdida: "no_respondio",
    detalle_perdida: "Tres seguimientos sin respuesta.",
    estado_previo: "conversacion",
  },

  // ─── Históricos · MARZO (entre 60 y 87 días atrás). 6 ganados (~41k)
  // ─── + 5 perdidos. Distribuidos entre ML/DT/SM.
  {
    nombre: "Constructora del Sur",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 9200,
    valor_final: 10800,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 105,
    dias_ultimo_contacto: 63,
    dias_cierre: 63,
    temperatura: "warm",
  },
  {
    nombre: "Estancia Don Jose",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 7400,
    valor_final: 8200,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "ML",
    dias_creacion: 100,
    dias_ultimo_contacto: 68,
    dias_cierre: 68,
    temperatura: "warm",
  },
  {
    nombre: "Café Belgrano",
    origen: "formulario",
    estado: "ganado",
    valor_estimado: 2900,
    valor_final: 2900,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 95,
    dias_ultimo_contacto: 72,
    dias_cierre: 72,
    temperatura: "warm",
  },
  {
    nombre: "Centro Imágenes Mar del Plata",
    origen: "linkedin",
    estado: "ganado",
    valor_estimado: 6100,
    valor_final: 6800,
    tipo_negocio: "proyecto",
    responsable: "DT",
    dias_creacion: 110,
    dias_ultimo_contacto: 76,
    dias_cierre: 76,
    temperatura: "warm",
  },
  {
    nombre: "Talleres Rosario",
    origen: "whatsapp",
    estado: "ganado",
    valor_estimado: 4200,
    valor_final: 4500,
    tipo_negocio: "recurrente",
    meses_compromiso: 6,
    responsable: "ML",
    dias_creacion: 90,
    dias_ultimo_contacto: 80,
    dias_cierre: 80,
    temperatura: "warm",
  },
  {
    nombre: "Boutique Recoleta",
    origen: "referido",
    estado: "ganado",
    valor_estimado: 7600,
    valor_final: 7800,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 102,
    dias_ultimo_contacto: 85,
    dias_cierre: 85,
    temperatura: "warm",
  },
  {
    nombre: "Inmobiliaria Liniers",
    origen: "formulario",
    estado: "perdido",
    valor_estimado: 5500,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 92,
    dias_ultimo_contacto: 62,
    dias_cierre: 62,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "Presupuesto reducido por cambios internos.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Agencia Mar Norte",
    origen: "linkedin",
    estado: "perdido",
    valor_estimado: 3800,
    tipo_negocio: "proyecto",
    responsable: "SM",
    dias_creacion: 88,
    dias_ultimo_contacto: 68,
    dias_cierre: 68,
    temperatura: "cool",
    motivo_perdida: "precio",
    detalle_perdida: "Eligieron alternativa más barata.",
    estado_previo: "cierre",
  },
  {
    nombre: "Estudio Audiovisual Bardo",
    origen: "referido",
    estado: "perdido",
    valor_estimado: 4400,
    tipo_negocio: "proyecto",
    responsable: "ML",
    dias_creacion: 96,
    dias_ultimo_contacto: 73,
    dias_cierre: 73,
    temperatura: "cool",
    motivo_perdida: "timing",
    detalle_perdida: "Postergaron el rebranding para 2027.",
    estado_previo: "propuesta",
  },
  {
    nombre: "Cooperativa El Trébol",
    origen: "formulario",
    estado: "perdido",
    valor_estimado: 2900,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "DT",
    dias_creacion: 100,
    dias_ultimo_contacto: 79,
    dias_cierre: 79,
    temperatura: "cool",
    motivo_perdida: "timing",
    detalle_perdida: "Decidieron esperar al próximo ejercicio.",
    estado_previo: "conversacion",
  },
  {
    nombre: "Despacho Aduanero Plata",
    origen: "linkedin",
    estado: "perdido",
    valor_estimado: 6200,
    tipo_negocio: "recurrente",
    meses_compromiso: 12,
    responsable: "SM",
    dias_creacion: 108,
    dias_ultimo_contacto: 82,
    dias_cierre: 82,
    temperatura: "cool",
    motivo_perdida: "competencia",
    detalle_perdida: "Eligieron a un competidor con red local.",
    estado_previo: "propuesta",
  },
];

// Historial de contactos: 1 a 3 por lead según madurez.
// Las notas son rioplatenses, contextualizadas al canal y la posición en la
// secuencia (primer / intermedio / último). Para los leads "estrella" del
// mockup (Aliaga, Vázquez, Norte, Mercurio, Don Eduardo) usamos textos
// curados para que cierren con el norte visual.
function historialContactos(lead: LeadSeed, leadId: string) {
  const contactos: Array<{
    lead_id: string;
    fecha: string;
    canal: Canal;
    nota: string;
    metadata: Record<string, unknown>;
  }> = [];

  const canalPrimerContacto: Record<Origen, Canal> = {
    formulario: "mail",
    referido: "mail",
    linkedin: "linkedin",
    whatsapp: "whatsapp",
  };

  const tieneSeguimiento =
    lead.dias_ultimo_contacto !== null &&
    lead.dias_ultimo_contacto < lead.dias_creacion;

  const intermedio = tieneSeguimiento
    ? Math.floor((lead.dias_creacion + lead.dias_ultimo_contacto!) / 2)
    : null;
  const incluyeIntermedio =
    intermedio !== null && intermedio > lead.dias_ultimo_contacto!;

  // Notas curadas para los 5 leads visibles en el tablero.
  const curadas: Record<string, { primero: string; intermedio?: string; ultimo?: string }> = {
    "Constructora Aliaga": {
      primero:
        "Llegaron por el formulario de la web. Pidieron presupuesto para reforma integral de oficinas en Vicente López. Respondí pidiendo llamado.",
      intermedio:
        "Hablé con Carlos (director). Necesitan empezar antes del 1 de junio. Pasaron cantidad de unidades y plazo. Quedé en mandar propuesta esta semana.",
      ultimo:
        "Mandé propuesta final con descuento del 15% por pago anticipado. Pidieron revisarla con socios y volver el lunes.",
    },
    "Estudio Vázquez & Asoc.": {
      primero:
        "Nos contactó por recomendación de Aliaga. Buscan armar área de marketing in-house. Coordinamos llamado para entender alcance.",
      intermedio:
        "Hablé con Sandra. Tienen presupuesto aprobado pero el socio mayoritario está de viaje hasta fin de mes. Reagendamos para confirmar.",
      ultimo:
        "Mail de seguimiento. Sin respuesta todavía, esperando que vuelva Vázquez para retomar.",
    },
    "Clínica Norte": {
      primero:
        "Conexión vía LinkedIn con la Dra. Yáñez. Tienen tres sedes y quieren unificar el sistema de turnos. Pidieron caso de estudio.",
      intermedio:
        "Llamado con el equipo administrativo. Validamos alcance y armamos propuesta con dos escenarios (básico y completo).",
      ultimo:
        "Enviada propuesta firmada por la Dra. Yáñez. Esperando OK del directorio para definir fecha de arranque.",
    },
    "Agencia Mercurio": {
      primero:
        "Llegaron por el formulario web. Pidieron presupuesto para rediseño de su producto interno. No están asignados a nadie aún.",
    },
    "Don Eduardo": {
      primero:
        "Me escribió por WhatsApp recomendado por su contador. Quiere ordenar la gestión de clientes de su estudio. Quedé en mandar opciones.",
      intermedio:
        "Llamado breve. Confirmó interés y pidió cotización con escenario mínimo. Es un cliente referido, prioridad alta.",
      ultimo:
        "Mandé cotización por WhatsApp con el plan más chico. Esperando que la revise con su socia.",
    },
  };

  const curada = curadas[lead.nombre];

  // Templates por canal para el resto de los leads.
  const nombreCorto = lead.nombre.split(" ")[0];
  const templatesPrimero: Record<Origen, string> = {
    formulario: `Llegaron por el formulario web. ${lead.origen_detalle ? `${lead.origen_detalle}.` : "Pidieron presupuesto inicial."} Respondí pidiendo más contexto.`,
    referido: `Nos llegaron por referido${lead.origen_detalle ? ` (${lead.origen_detalle})` : ""}. Mandé presentación corta y coordiné llamado.`,
    linkedin: `Conexión vía LinkedIn. Vieron contenido nuestro y pidieron más info de cómo trabajamos.`,
    whatsapp: `Me escribieron por WhatsApp pidiendo info. Quedé en mandar opciones por mail.`,
  };
  const templatesIntermedio = [
    `Llamado con el equipo de ${nombreCorto}. Confirmaron presupuesto y necesidades. Quedé en mandar propuesta.`,
    `Hablamos por teléfono, validamos alcance y armamos próximos pasos. Buen feeling.`,
    `Llamado de seguimiento. Pidieron ajustar algunos puntos del alcance. Reviso y reenvío.`,
  ];
  const templatesUltimo = [
    `Mail de seguimiento. Pedí confirmación sobre la propuesta. Sin respuesta todavía.`,
    `Reenvié la propuesta con los ajustes que pidieron. Esperando feedback.`,
    `Mandé recordatorio con resumen de los puntos clave. Quedaron de responder esta semana.`,
  ];

  // Reproducible: rotamos por hash simple del nombre.
  const hash = Array.from(lead.nombre).reduce((s, c) => s + c.charCodeAt(0), 0);

  // 1) Primer contacto
  contactos.push({
    lead_id: leadId,
    fecha: diasAtras(lead.dias_creacion),
    canal: canalPrimerContacto[lead.origen],
    nota: curada?.primero ?? templatesPrimero[lead.origen],
    metadata: {},
  });

  // 2) Intermedio (opcional)
  if (incluyeIntermedio) {
    contactos.push({
      lead_id: leadId,
      fecha: diasAtras(intermedio!),
      canal: "llamado",
      nota: curada?.intermedio ?? templatesIntermedio[hash % templatesIntermedio.length],
      metadata: {},
    });
  }

  // 3) Último contacto
  if (tieneSeguimiento) {
    contactos.push({
      lead_id: leadId,
      fecha: diasAtras(lead.dias_ultimo_contacto!),
      canal: "mail",
      nota: curada?.ultimo ?? templatesUltimo[hash % templatesUltimo.length],
      metadata: {},
    });
  }

  return contactos;
}

// Para que /conversion tenga datos realistas: por cada lead en estado >= 'conversacion',
// generamos los cambios_estado intermedios distribuidos en el tiempo entre
// fecha_creacion y hoy. Esto alimenta v_tiempo_por_etapa.
const ORDEN_ESTADOS_SEED: Estado[] = [
  "nuevo",
  "conversacion",
  "propuesta",
  "cierre",
  "ganado",
];

function cambiosEstadoSimulados(lead: LeadSeed, leadId: string) {
  const cambios: Array<{
    lead_id: string;
    fecha: string;
    canal: Canal;
    nota: string;
    metadata: Record<string, string>;
  }> = [];

  // Estado "efectivo" para distribuir la cadena de cambios. Para perdidos
  // usamos su estado_previo (la trayectoria normal antes de perderse) y
  // sumamos un último cambio "de estado_previo a perdido" al final.
  const estadoCadena: Estado =
    lead.estado === "perdido"
      ? (lead.estado_previo ?? "conversacion")
      : lead.estado;
  const idxFinal = ORDEN_ESTADOS_SEED.indexOf(estadoCadena);
  if (idxFinal > 0) {
    for (let i = 1; i <= idxFinal; i++) {
      const from = ORDEN_ESTADOS_SEED[i - 1];
      const to = ORDEN_ESTADOS_SEED[i];
      // El i-ésimo cambio cae a t = dias_creacion * (1 - i/(idxFinal+1)).
      // Override: el último cambio (i === idxFinal) puede forzarse con
      // dias_en_estado_actual.
      const fraccion = i / (idxFinal + 1);
      const usaOverride =
        i === idxFinal && lead.dias_en_estado_actual !== undefined;
      const diasAtrasCambio = usaOverride
        ? lead.dias_en_estado_actual!
        : Math.max(0, Math.round(lead.dias_creacion * (1 - fraccion)));
      cambios.push({
        lead_id: leadId,
        fecha: diasAtras(diasAtrasCambio),
        canal: "cambio_estado",
        nota: `De ${from} a ${to}`,
        metadata: { from, to },
      });
    }
  }

  // Cambio final hacia 'perdido' (solo perdidos). Permite a v_perdidos_mes
  // deducir estado_previo via metadata.from.
  if (lead.estado === "perdido") {
    const diasCierre = lead.dias_cierre ?? 0;
    cambios.push({
      lead_id: leadId,
      fecha: diasAtras(diasCierre),
      canal: "cambio_estado",
      nota: `De ${estadoCadena} a perdido`,
      metadata: { from: estadoCadena, to: "perdido" },
    });
  }

  return cambios;
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

  // Borrado en orden inverso a las FKs. Incluye `patrones` (no tiene FK
  // a las otras, pero se limpia para que la pantalla /patrones arranque
  // recalculando contra los datos frescos).
  //
  // Sprint 6.1: acotado por organizacion_id = DEMO_ORG_ID. service_role
  // bypassa RLS, así que sin este filtro un seed equivocado podría
  // borrar datos de otra org (ej. JS80).
  for (const tabla of ["patrones", "contactos", "agenda", "leads", "comerciales"] as const) {
    const { error } = await supabase
      .from(tabla)
      .delete()
      .eq("organizacion_id", DEMO_ORG_ID);
    if (error) throw new Error(`Limpiando ${tabla}: ${error.message}`);
  }

  const { data: comInsertados, error: errCom } = await supabase
    .from("comerciales")
    .insert(COMERCIALES.map((c) => ({ ...c, organizacion_id: DEMO_ORG_ID })))
    .select();
  if (errCom || !comInsertados) {
    throw new Error(`Insertando comerciales: ${errCom?.message ?? "sin data"}`);
  }

  const porIni = (ini: "ML" | "DT" | "SM") =>
    comInsertados.find((c) => c.iniciales === ini)!.id;

  const leadsPayload = LEADS.map((l) => ({
    organizacion_id: DEMO_ORG_ID,
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
    // Columnas de cierre (solo se setean en ganados/perdidos).
    fecha_cierre: l.dias_cierre !== undefined ? diasAtras(l.dias_cierre) : null,
    valor_final: l.valor_final ?? null,
    motivo_perdida: l.motivo_perdida ?? null,
    detalle_perdida: l.detalle_perdida ?? null,
    comentario_cierre: l.comentario_cierre ?? null,
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

  // Cambios de estado simulados para que /conversion tenga data realista
  // (timing por etapa, trayectoria del lead). El trigger los ignora para
  // no afectar fecha_ultimo_contacto.
  const cambiosEstado = LEADS.flatMap((l) => {
    const id = leadIdPorNombre.get(l.nombre);
    if (!id) return [];
    return cambiosEstadoSimulados(l, id);
  });

  const todosContactos = [...contactos, ...cambiosEstado];

  const { error: errContactos } = await supabase
    .from("contactos")
    .insert(
      todosContactos.map((c) => ({ ...c, organizacion_id: DEMO_ORG_ID })),
    );
  if (errContactos) {
    throw new Error(`Insertando contactos: ${errContactos.message}`);
  }

  const agendaPayload = AGENDA.map((e) => ({
    organizacion_id: DEMO_ORG_ID,
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
    contactos: todosContactos.length,
    agenda: agendaPayload.length,
  };
}
