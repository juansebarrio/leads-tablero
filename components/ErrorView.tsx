// Pantalla amigable para errores típicos de configuración (DB caída o
// env vars faltantes). Mismo estilo del sistema, sin chrome (sidebar/agenda)
// porque si el chrome también requiere queries, no podríamos renderizarlo.

interface ErrorViewProps {
  titulo: string;
  tituloEm: string;
  mensaje: string;
  pasos?: React.ReactNode;
  detalle?: unknown;
}

export function ErrorView({
  titulo,
  tituloEm,
  mensaje,
  pasos,
  detalle,
}: ErrorViewProps) {
  const detalleText =
    detalle instanceof Error ? detalle.message : detalle ? String(detalle) : null;

  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1
        className="font-display text-3xl font-medium tracking-tight text-ink"
        style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
      >
        {titulo}{" "}
        <em className="italic text-violeta font-medium">{tituloEm}</em>.
      </h1>
      <p className="text-muted mt-3">{mensaje}</p>
      {pasos && (
        <div className="mt-4 text-ink-2 text-[13.5px]">{pasos}</div>
      )}
      {detalleText && (
        <pre className="mt-6 text-[11px] text-rojo bg-rojo-soft border border-rojo/20 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
          {detalleText}
        </pre>
      )}
    </main>
  );
}

// Helper de uso común: la lista de pasos para configurar Supabase local.
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
