// Helpers de formateo en es-AR.
//
// Importante: TODOS los formats de fecha/hora fijan el timezone en
// `America/Argentina/Buenos_Aires`. Esto evita hydration mismatches entre
// Server (suele correr en UTC) y Client (timezone del usuario), y mantiene
// la demo coherente sin importar dónde se vea.

const LOCALE = "es-AR";
const TZ = "America/Argentina/Buenos_Aires";

// Defensivos: si recibe null/undefined/string-numérico, los normaliza a number.
// Si después de normalizar no es un número finito, devuelve "USD 0" (en lugar
// de "USD NaN" o crashear). Supabase a veces devuelve `numeric` como string.
export function formatUSD(n: number | string | null | undefined): string {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "USD 0";
  return `USD ${num.toLocaleString(LOCALE, { maximumFractionDigits: 0 })}`;
}

// Versión corta para chips/sumas pequeñas: 12k, 187k, etc.
export function formatUSDCorto(n: number | string | null | undefined): string {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1000) {
    const k = num / 1000;
    return `${k.toLocaleString(LOCALE, { maximumFractionDigits: 1 })}k`;
  }
  return num.toString();
}

function capitalizar(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "Lunes 25 de mayo · 09:14" — en ART, 24h.
export function formatEyebrowFecha(d: Date = new Date()): string {
  const dia = new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    timeZone: TZ,
  }).format(d);
  const fecha = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(d);
  const hora = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(d);
  return `${capitalizar(dia)} ${fecha} · ${hora}`;
}

// "10:00" en ART, 24h. Recibe ISO string.
export function formatHora(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

// "Mayo 2026" para el eyebrow del header del pipeline.
export function formatMesAnio(d: Date = new Date()): string {
  const s = new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(d);
  return capitalizar(s);
}

// "30 min" / "1 h" / "1 h 30 min"
export function formatDuracion(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}

// Saludo según hora en ART (no según la hora local del runtime). Evita que el
// server salude "buen día" y el client lo cambie tras la hidratación.
export function saludoSegunHora(d: Date = new Date()): string {
  const horaStr = new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).format(d);
  const h = parseInt(horaStr, 10);
  if (!Number.isFinite(h)) return "buen día";
  if (h < 12) return "buen día";
  if (h < 19) return "buenas tardes";
  return "buenas noches";
}
