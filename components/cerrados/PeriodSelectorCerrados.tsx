// Selector visual de período. Por ahora solo "Este mes" está implementado;
// las otras dos opciones quedan deshabilitadas con label "próximamente" para
// no ofrecer un control que no lleva a nada.
export function PeriodSelectorCerrados() {
  return (
    <div className="inline-flex bg-panel border border-line rounded-lg p-1 gap-0.5 shrink-0">
      <span className="px-3 py-1.5 rounded-md font-medium text-[12.5px] bg-ink text-white">
        Este mes
      </span>
      <button
        type="button"
        disabled
        title="Próximamente"
        className="px-3 py-1.5 rounded-md font-medium text-[12.5px] text-muted-2 cursor-not-allowed"
      >
        Mes anterior
      </button>
      <button
        type="button"
        disabled
        title="Próximamente"
        className="px-3 py-1.5 rounded-md font-medium text-[12.5px] text-muted-2 cursor-not-allowed"
      >
        Trimestre
      </button>
    </div>
  );
}
