interface Props {
  label: string;
  count?: string;
  children: React.ReactNode;
  emptyHint?: string;
}

// Sección agrupada del command palette. Si `children` es un array vacío y
// hay emptyHint, lo muestra para confirmar que se buscó en esa categoría.
export function ResultGroup({ label, count, children, emptyHint }: Props) {
  return (
    <div className="py-1.5">
      <div className="px-[18px] pt-2 pb-1.5 text-[10px] text-muted tracking-[0.08em] uppercase font-bold flex items-center justify-between">
        <span>{label}</span>
        {count && <span className="text-muted-2 font-medium">{count}</span>}
      </div>
      {Array.isArray(children) && children.length === 0 && emptyHint ? (
        <div className="px-[18px] py-1.5 text-[11.5px] text-muted-2">
          {emptyHint}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
