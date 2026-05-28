// Banner sobrio que avisa al visitante que está en la vitrina demo.
// Server component — el modo se decide en build/server, nunca llega al
// browser un banner que no corresponde.
//
// Montado en app/layout.tsx condicionado por config.showDemoBanner
// (fail-closed en lib/config.ts).

export function DemoBanner() {
  return (
    <div
      role="status"
      aria-label="Aviso de modo demo"
      className="w-full border-b border-line bg-panel-2"
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-2 text-[12px] leading-tight text-muted">
        <span className="font-medium text-ink-2">Demo pública</span>
        <span className="mx-2 text-muted-2">·</span>
        los datos son de ejemplo y se reinician cada día.
      </div>
    </div>
  );
}
