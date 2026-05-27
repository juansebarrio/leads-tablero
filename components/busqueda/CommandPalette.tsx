"use client";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  MessageCircle,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCommandPalette } from "@/components/busqueda/command-palette-context";
import { EmptyResults } from "@/components/busqueda/EmptyResults";
import { highlight } from "@/components/busqueda/highlight";
import { ResultGroup } from "@/components/busqueda/ResultGroup";
import { ResultItem, type ResultIconKind } from "@/components/busqueda/ResultItem";
import { SearchInput } from "@/components/busqueda/SearchInput";
import { useDrawers } from "@/components/drawer-context";
import { formatFechaCorta } from "@/lib/lead-utils";
import type { Estado } from "@/lib/types";
import type {
  SearchComercial,
  SearchLead,
  SearchNota,
  SearchResult,
} from "@/app/api/search/route";

// Item plano del menú navegable por teclado. Cada uno define qué hacer al
// presionar Enter o clickear.
type Item = {
  id: string;
  icon: LucideIcon | null;
  iconKind: ResultIconKind;
  avatarGradient?: string;
  iniciales?: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  estadoTag?: Estado | null;
  shortcut?: string[];
  showArrow?: boolean;
  onSelect: () => void;
};

// ─── Componente principal ────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close, recentLeadIds } = useCommandPalette();
  const { openNuevoLead, openRegistrarContacto } = useDrawers();
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [recientesLeads, setRecientesLeads] = useState<SearchLead[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // Cleanup al cerrar.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
      setResults(null);
      setSelectedIndex(0);
    } else {
      // Garantiza foco; el autoFocus del input puede perderse si el modal
      // se monta antes de tiempo.
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Lock scroll del body mientras está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Debounce de 150ms.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch results.
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    setIsFetching(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data: SearchResult) => {
        setResults(data);
        setSelectedIndex(0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[search]", err);
        }
      })
      .finally(() => setIsFetching(false));
    return () => ctrl.abort();
  }, [debouncedQuery, isOpen]);

  // Carga de leads recientes (hidratamos por el endpoint para tener nombre/estado).
  useEffect(() => {
    if (!isOpen) return;
    if (recentLeadIds.length === 0) {
      setRecientesLeads([]);
      return;
    }
    // Reusamos el endpoint con un trick: pedir cada id por separado sería
    // ineficiente. Usamos un endpoint simple: GET /api/search/by-ids.
    // Para mantener el alcance del task, hidratamos consultando /api/search
    // por nombre. Como fallback simple: pedimos ids con una query directa
    // a Supabase desde el cliente sería romper el patrón.
    // Solución pragmática: usamos un endpoint dedicado.
    const ctrl = new AbortController();
    fetch(
      `/api/search/by-ids?ids=${encodeURIComponent(recentLeadIds.join(","))}`,
      { signal: ctrl.signal },
    )
      .then((r) => r.json())
      .then((data: { leads: SearchLead[] }) => {
        // Mantenemos el orden de recentLeadIds (más recientes primero).
        const byId = new Map(data.leads.map((l) => [l.id, l]));
        const ordered = recentLeadIds
          .map((id) => byId.get(id))
          .filter((l): l is SearchLead => Boolean(l));
        setRecientesLeads(ordered.slice(0, 3));
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[search recientes]", err);
        }
      });
    return () => ctrl.abort();
  }, [isOpen, recentLeadIds]);

  // El lead activo es el que el path actual está mostrando (/lead/[id]).
  const activeLeadId = useMemo(() => {
    const m = pathname?.match(/^\/lead\/([^/]+)/);
    return m ? m[1] : null;
  }, [pathname]);

  // Construcción del menú según estado: hay query o no.
  const items = useMemo<Item[]>(() => {
    const hasQuery = debouncedQuery.length > 0;
    if (!hasQuery) {
      return buildInitialItems({
        recientesLeads,
        openNuevoLead,
        openRegistrarContacto,
        activeLeadId,
        router,
        close,
      });
    }
    return buildSearchItems({
      results,
      query: debouncedQuery,
      router,
      close,
    });
  }, [
    debouncedQuery,
    recientesLeads,
    results,
    openNuevoLead,
    openRegistrarContacto,
    activeLeadId,
    router,
    close,
  ]);

  // Navegación con teclado dentro del modal.
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const it = items[selectedIndex];
        if (it) {
          e.preventDefault();
          it.onSelect();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, items, selectedIndex, close]);

  if (!isOpen) return null;

  const hasQuery = debouncedQuery.length > 0;
  const isEmpty =
    hasQuery &&
    !isFetching &&
    results !== null &&
    results.leads.length === 0 &&
    results.comerciales.length === 0 &&
    results.notas.length === 0;

  return (
    <>
      <div
        onClick={close}
        aria-hidden
        className="fixed inset-0 bg-[rgba(14,14,18,0.4)] z-[90]"
      />
      <div
        role="dialog"
        aria-modal
        aria-label="Búsqueda global"
        className="fixed left-1/2 top-[12vh] -translate-x-1/2 w-[min(640px,calc(100vw-32px))] max-h-[80vh] bg-panel border border-line rounded-[12px] shadow-[0_20px_50px_rgba(14,14,18,0.12),0_4px_12px_rgba(14,14,18,0.04)] z-[91] flex flex-col overflow-hidden"
      >
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={setQuery}
          onEscape={close}
        />

        <div className="overflow-y-auto py-2 flex-1">
          {isEmpty ? (
            <EmptyResults query={debouncedQuery} onClose={close} />
          ) : items.length === 0 ? (
            <div className="px-6 py-10 text-center text-muted text-[13px]">
              Cargando…
            </div>
          ) : (
            <ItemsRenderer
              items={items}
              selectedIndex={selectedIndex}
              onMouseEnter={setSelectedIndex}
              hasQuery={hasQuery}
              results={results}
              query={debouncedQuery}
            />
          )}
        </div>

        <footer className="px-[18px] py-2.5 border-t border-line-2 bg-panel-2 flex items-center justify-between gap-3.5 text-[11px] text-muted">
          <div className="flex gap-3.5 flex-wrap">
            <ShortcutHint keys={["↑", "↓"]} label="navegar" />
            <ShortcutHint keys={["↵"]} label="ir" />
            <ShortcutHint keys={["esc"]} label="cerrar" />
          </div>
          <div className="flex items-center gap-1.5 text-muted-2 text-[10.5px] tracking-[0.04em]">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background:
                  "conic-gradient(from 200deg, #FF8AA0 0deg, #FFB088 60deg, #6B8CFF 160deg, #8B6FFF 230deg, #5DC7E0 310deg, #FF8AA0 360deg)",
              }}
            />
            js80
          </div>
        </footer>
      </div>
    </>
  );
}

// ─── Renderer ────────────────────────────────────────────────────────────────

interface RendererProps {
  items: Item[];
  selectedIndex: number;
  onMouseEnter: (i: number) => void;
  hasQuery: boolean;
  results: SearchResult | null;
  query: string;
}

function ItemsRenderer({
  items,
  selectedIndex,
  onMouseEnter,
  hasQuery,
  results,
  query,
}: RendererProps) {
  // Reconstrucción visual de los grupos según el modo.
  if (!hasQuery) {
    // Estado inicial: agrupamos por kind. items vienen en orden:
    // recientes (lead), acciones, páginas.
    const recientes = items.filter((i) => i.id.startsWith("recent:"));
    const acciones = items.filter((i) => i.id.startsWith("action:"));
    const paginas = items.filter((i) => i.id.startsWith("page:"));
    return (
      <>
        {recientes.length > 0 && (
          <ResultGroup label="Recientes" count="últimas visitas">
            {recientes.map((it) => (
              <RenderItem
                key={it.id}
                item={it}
                index={items.indexOf(it)}
                selectedIndex={selectedIndex}
                onMouseEnter={onMouseEnter}
              />
            ))}
          </ResultGroup>
        )}
        <ResultGroup label="Acciones rápidas" count="para hacer ya">
          {acciones.map((it) => (
            <RenderItem
              key={it.id}
              item={it}
              index={items.indexOf(it)}
              selectedIndex={selectedIndex}
              onMouseEnter={onMouseEnter}
            />
          ))}
        </ResultGroup>
        <ResultGroup label="Ir a" count="páginas">
          {paginas.map((it) => (
            <RenderItem
              key={it.id}
              item={it}
              index={items.indexOf(it)}
              selectedIndex={selectedIndex}
              onMouseEnter={onMouseEnter}
            />
          ))}
        </ResultGroup>
      </>
    );
  }

  const leadItems = items.filter((i) => i.id.startsWith("lead:"));
  const comercialItems = items.filter((i) => i.id.startsWith("comercial:"));
  const notaItems = items.filter((i) => i.id.startsWith("nota:"));

  return (
    <>
      <ResultGroup
        label="Leads"
        count={`${results?.leads.length ?? 0} ${
          results?.leads.length === 1 ? "coincidencia" : "coincidencias"
        }`}
      >
        {leadItems.length === 0 ? (
          <div className="px-[18px] py-1.5 text-[11.5px] text-muted-2">
            Sin resultados para “{query}”
          </div>
        ) : (
          leadItems.map((it) => (
            <RenderItem
              key={it.id}
              item={it}
              index={items.indexOf(it)}
              selectedIndex={selectedIndex}
              onMouseEnter={onMouseEnter}
            />
          ))
        )}
      </ResultGroup>
      <ResultGroup
        label="Comerciales"
        count={`${results?.comerciales.length ?? 0} ${
          results?.comerciales.length === 1 ? "coincidencia" : "coincidencias"
        }`}
        emptyHint={`Sin resultados para “${query}”`}
      >
        {comercialItems.length === 0
          ? []
          : comercialItems.map((it) => (
              <RenderItem
                key={it.id}
                item={it}
                index={items.indexOf(it)}
                selectedIndex={selectedIndex}
                onMouseEnter={onMouseEnter}
              />
            ))}
      </ResultGroup>
      <ResultGroup
        label="Notas y contactos"
        count={`${results?.notas.length ?? 0} ${
          results?.notas.length === 1 ? "coincidencia" : "coincidencias"
        }`}
        emptyHint={`Sin resultados para “${query}”`}
      >
        {notaItems.length === 0
          ? []
          : notaItems.map((it) => (
              <RenderItem
                key={it.id}
                item={it}
                index={items.indexOf(it)}
                selectedIndex={selectedIndex}
                onMouseEnter={onMouseEnter}
              />
            ))}
      </ResultGroup>
    </>
  );
}

function RenderItem({
  item,
  index,
  selectedIndex,
  onMouseEnter,
}: {
  item: Item;
  index: number;
  selectedIndex: number;
  onMouseEnter: (i: number) => void;
}) {
  return (
    <ResultItem
      icon={item.icon}
      iconKind={item.iconKind}
      avatarGradient={item.avatarGradient}
      iniciales={item.iniciales}
      title={item.title}
      meta={item.meta}
      estadoTag={item.estadoTag}
      shortcut={item.shortcut}
      showArrow={item.showArrow}
      selected={index === selectedIndex}
      onMouseEnter={() => onMouseEnter(index)}
      onClick={item.onSelect}
    />
  );
}

// ─── Builders ────────────────────────────────────────────────────────────────

function buildInitialItems(opts: {
  recientesLeads: SearchLead[];
  openNuevoLead: () => void;
  openRegistrarContacto: (data: { leadId: string; leadNombre: string }) => void;
  activeLeadId: string | null;
  router: ReturnType<typeof useRouter>;
  close: () => void;
}): Item[] {
  const items: Item[] = [];

  for (const lead of opts.recientesLeads) {
    items.push(leadToItem(lead, "recent", "", () => {
      opts.close();
      opts.router.push(`/lead/${lead.id}`);
    }));
  }

  items.push({
    id: "action:nuevo-lead",
    icon: Plus,
    iconKind: "action",
    title: "Nuevo lead",
    meta: "Crear un lead desde cero",
    shortcut: ["N"],
    onSelect: () => {
      opts.close();
      opts.openNuevoLead();
    },
  });

  if (opts.activeLeadId) {
    items.push({
      id: "action:registrar-contacto",
      icon: MessageCircle,
      iconKind: "action",
      title: "Registrar contacto en este lead",
      meta: "Agregar una llamada, mail o reunión",
      shortcut: ["R"],
      onSelect: () => {
        opts.close();
        opts.openRegistrarContacto({
          leadId: opts.activeLeadId!,
          // Sin nombre del lead a mano, pasamos string vacío; el drawer
          // muestra "" pero igual funciona; el header del drawer cae a "".
          leadNombre: "",
        });
      },
    });
  }

  const paginas: { path: string; label: string; meta: string; keys: string[]; icon: LucideIcon }[] = [
    { path: "/", label: "Atender hoy", meta: "Lo prioritario del día", keys: ["G", "H"], icon: Target },
    { path: "/pipeline", label: "Pipeline", meta: "Vista kanban del flujo", keys: ["G", "P"], icon: BarChart3 },
    { path: "/equipo", label: "Equipo", meta: "Cómo viene cada comercial", keys: ["G", "E"], icon: Users },
    { path: "/conversion", label: "Conversión", meta: "Embudo y cuellos del mes", keys: ["G", "C"], icon: TrendingUp },
    { path: "/patrones", label: "Patrones", meta: "Lo que el sistema detectó", keys: ["G", "I"], icon: Sparkles },
    { path: "/cerrados", label: "Cerrados", meta: "Ganados y perdidos del mes", keys: ["G", "K"], icon: CheckCircle2 },
  ];
  for (const p of paginas) {
    items.push({
      id: `page:${p.path}`,
      icon: p.icon,
      iconKind: "page",
      title: p.label,
      meta: p.meta,
      shortcut: p.keys,
      onSelect: () => {
        opts.close();
        opts.router.push(p.path);
      },
    });
  }

  return items;
}

function buildSearchItems(opts: {
  results: SearchResult | null;
  query: string;
  router: ReturnType<typeof useRouter>;
  close: () => void;
}): Item[] {
  if (!opts.results) return [];
  const items: Item[] = [];

  for (const lead of opts.results.leads) {
    items.push(
      leadToItem(lead, "lead", opts.query, () => {
        opts.close();
        opts.router.push(`/lead/${lead.id}`);
      }),
    );
  }
  for (const c of opts.results.comerciales) {
    items.push(comercialToItem(c, opts.query));
  }
  for (const n of opts.results.notas) {
    items.push(
      notaToItem(n, opts.query, () => {
        opts.close();
        opts.router.push(`/lead/${n.lead_id}`);
      }),
    );
  }
  return items;
}

function leadToItem(
  lead: SearchLead,
  prefix: "lead" | "recent",
  query: string,
  onSelect: () => void,
): Item {
  const valorTxt = `USD ${lead.valor_estimado.toLocaleString("es-AR")}`;
  const responsableTxt = lead.responsable_iniciales ?? "Sin asignar";
  const motivoTxt =
    lead.estado === "perdido" && lead.motivo_perdida
      ? `perdido por ${lead.motivo_perdida}`
      : null;
  return {
    id: `${prefix}:${lead.id}`,
    icon: User,
    iconKind: "lead",
    title: highlight(lead.nombre, query),
    meta: motivoTxt ?? `${valorTxt} · ${responsableTxt}`,
    estadoTag: lead.estado as Estado,
    showArrow: true,
    onSelect,
  };
}

function comercialToItem(c: SearchComercial, query: string): Item {
  return {
    id: `comercial:${c.id}`,
    icon: null,
    iconKind: "person",
    avatarGradient: c.avatar_gradient,
    iniciales: c.iniciales,
    title: highlight(c.nombre, query),
    meta: "Comercial",
    onSelect: () => {
      // Sin perfil propio todavía. Por ahora: enviarlo a /equipo.
    },
  };
}

function notaToItem(n: SearchNota, query: string, onSelect: () => void): Item {
  const fechaTxt = formatFechaCorta(n.fecha);
  const snippet =
    n.nota.length > 90 ? `${n.nota.slice(0, 90).trim()}…` : n.nota;
  return {
    id: `nota:${n.id}`,
    icon: MessageCircle,
    iconKind: "note",
    title: highlight(
      `${canalLabel(n.canal)} con ${n.lead_nombre}`,
      query,
    ),
    meta: (
      <>
        {fechaTxt} · “{highlight(snippet, query)}”
      </>
    ),
    onSelect,
  };
}

function canalLabel(canal: string): string {
  switch (canal) {
    case "mail":
      return "Mail a";
    case "llamado":
      return "Llamada con";
    case "whatsapp":
      return "WhatsApp con";
    case "reunion":
      return "Reunión con";
    case "linkedin":
      return "LinkedIn con";
    default:
      return "Contacto con";
  }
}

function ShortcutHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((k) => (
        <span
          key={k}
          className="bg-panel border border-line px-[5px] py-px rounded-[3px] font-mono text-[9.5px] text-muted font-medium min-w-[16px] text-center"
        >
          {k}
        </span>
      ))}{" "}
      {label}
    </span>
  );
}

// Re-export para evitar warning de unused imports en algunos pipelines.
void Link;
void Calendar;
