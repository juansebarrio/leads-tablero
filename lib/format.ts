// Helpers de formateo en es-AR.

export function formatUSD(n: number): string {
  return `USD ${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

// Versión corta para chips/sumas pequeñas: 12k, 187k, etc.
export function formatUSDCorto(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toLocaleString("es-AR", { maximumFractionDigits: 1 })}k`;
  }
  return n.toString();
}

function capitalizar(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// "Lunes 25 de mayo · 09:14"
export function formatEyebrowFecha(d: Date = new Date()): string {
  const dia = d.toLocaleDateString("es-AR", { weekday: "long" });
  const fecha = d.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
  });
  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${capitalizar(dia)} ${fecha} · ${hora}`;
}

// "10:00"
export function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "30 min" / "1 h" / "1 h 30 min"
export function formatDuracion(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}

export function saludoSegunHora(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "buen día";
  if (h < 19) return "buenas tardes";
  return "buenas noches";
}
