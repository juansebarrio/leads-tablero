import Link from "next/link";

// Pantalla amigable para errores típicos de configuración (DB caída o
// env vars faltantes). En producción muestra una UI suave con CTA.
// En desarrollo muestra el detalle técnico + pasos de setup local.

interface ErrorViewProps {
  titulo: string;
  tituloEm: string;
  mensaje: string;
  // Solo se renderiza en development.
  pasos?: React.ReactNode;
  detalle?: unknown;
  // Override del CTA. Por default lleva a la home.
  cta?: { label: string; href: string };
}

export function ErrorView({
  titulo,
  tituloEm,
  mensaje,
  pasos,
  detalle,
  cta,
}: ErrorViewProps) {
  const isDev = process.env.NODE_ENV === "development";
  const detalleText = isDev ? formatDetalle(detalle) : null;
  const ctaResuelto = cta ?? { label: "Volver al tablero", href: "/" };
  const mensajeProd =
    "Algo no se cargó como esperábamos. Probá refrescar o volver al tablero.";

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-xl w-full text-center">
        <h1
          className="font-display text-3xl md:text-4xl font-medium tracking-tight text-ink"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          {titulo}{" "}
          <em className="italic text-violeta font-medium">{tituloEm}</em>.
        </h1>
        <p className="text-muted mt-3">{isDev ? mensaje : mensajeProd}</p>

        <div className="mt-6">
          <Link
            href={ctaResuelto.href}
            className="inline-flex items-center gap-1.5 bg-ink text-white border border-ink px-4 py-2.5 rounded-md font-medium text-[13px] hover:bg-violeta hover:border-violeta transition cursor-pointer"
          >
            {ctaResuelto.label}
          </Link>
        </div>

        {isDev && pasos && (
          <div className="mt-8 text-left text-ink-2 text-[13.5px] border-t border-line pt-6">
            <div className="text-[10.5px] uppercase tracking-[0.06em] font-semibold text-muted mb-3">
              Pasos para configurar local
            </div>
            {pasos}
          </div>
        )}

        {detalleText && (
          <pre className="mt-4 text-left text-[11px] text-rojo bg-rojo-soft border border-rojo/20 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {detalleText}
          </pre>
        )}
      </div>
    </main>
  );
}

// Helper que extrae mensaje legible de cualquier shape de error:
// - Error / Error subclass → .message
// - PostgrestError de Supabase → { message, code, details, hint }
// - string → tal cual
// - unknown → JSON
function formatDetalle(d: unknown): string | null {
  if (d == null) return null;
  if (typeof d === "string") return d;
  if (d instanceof Error) return d.message;
  if (typeof d === "object") {
    const obj = d as Record<string, unknown>;
    if (typeof obj.message === "string") {
      const parts = [obj.message];
      if (obj.code) parts.push(`(code: ${obj.code})`);
      if (obj.details) parts.push(`\n${obj.details}`);
      if (obj.hint) parts.push(`\nhint: ${obj.hint}`);
      return parts.join(" ");
    }
    try {
      return JSON.stringify(d, null, 2);
    } catch {
      return String(d);
    }
  }
  return String(d);
}

// Helper de uso común: la lista de pasos para configurar Supabase local.
// Solo se renderiza si ErrorView detecta development.
export function PasosConfigSupabase() {
  return (
    <ol className="list-decimal list-inside space-y-1">
      <li>
        <code className="bg-panel-2 border border-line px-1.5 py-0.5 rounded">
          pnpm db:start
        </code>{" "}
        (requiere Docker)
      </li>
      <li>
        Copiar las keys que imprime a{" "}
        <code className="bg-panel-2 border border-line px-1.5 py-0.5 rounded">
          .env.local
        </code>{" "}
        (ver{" "}
        <code className="bg-panel-2 border border-line px-1.5 py-0.5 rounded">
          .env.example
        </code>
        )
      </li>
      <li>
        <code className="bg-panel-2 border border-line px-1.5 py-0.5 rounded">
          pnpm db:reset
        </code>{" "}
        y{" "}
        <code className="bg-panel-2 border border-line px-1.5 py-0.5 rounded">
          pnpm db:seed
        </code>
      </li>
    </ol>
  );
}
