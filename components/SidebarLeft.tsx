"use client";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  MessageSquare,
  Search,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nucleus } from "@/components/Nucleus";
import { useDrawers } from "@/components/drawer-context";

export type SidebarCounts = {
  atenderHoy?: number;
  agenda?: number;
  pipeline?: number; // total de leads del pipeline
  nuevos?: number;
  conversacion?: number;
  propuesta?: number;
  ganados?: number | null; // null muestra "—"
  patrones?: number;
};

interface SidebarLeftProps {
  counts?: SidebarCounts;
}

type NavItem = {
  label: string;
  icon: LucideIcon;
  count?: number | null;
  alert?: boolean;
  href?: string;
};

export function SidebarLeft({ counts = {} }: SidebarLeftProps) {
  const { sidebarOpen, closeAll } = useDrawers();
  const pathname = usePathname();

  const hoy: NavItem[] = [
    {
      label: "Atender hoy",
      icon: Target,
      count: counts.atenderHoy ?? 0,
      alert: true,
      href: "/",
    },
    { label: "Agenda", icon: Calendar, count: counts.agenda ?? 0 },
  ];

  const pipeline: NavItem[] = [
    {
      label: "Pipeline",
      icon: BarChart3,
      count: counts.pipeline,
      href: "/pipeline",
    },
    { label: "Leads nuevos", icon: Clock, count: counts.nuevos ?? 0 },
    {
      label: "En conversación",
      icon: MessageSquare,
      count: counts.conversacion ?? 0,
    },
    { label: "Propuestas", icon: FileText, count: counts.propuesta ?? 0 },
    {
      label: "Cerrados",
      icon: CheckCircle2,
      count: counts.ganados === null ? null : counts.ganados ?? 0,
    },
  ];

  const inteligencia: NavItem[] = [
    { label: "Patrones", icon: Layers, count: counts.patrones ?? 0 },
    { label: "Conversión", icon: TrendingUp },
    { label: "Equipo", icon: Users },
  ];

  return (
    <aside
      className={`
        bg-panel border-r border-line p-[18px] pt-[22px] flex flex-col gap-5
        fixed top-0 left-0 h-screen w-[260px] z-70
        transition-transform duration-250 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:static lg:translate-x-0 lg:w-[220px] lg:h-screen lg:sticky lg:top-0
        lg:shadow-none shadow-[8px_0_32px_rgba(14,14,18,0.08)]
      `}
      style={{ zIndex: 70 }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 pb-[18px] border-b border-line">
        <Nucleus />
        <div>
          <div
            className="font-display font-semibold text-[17px] leading-none -tracking-[0.01em]"
            style={{ fontVariationSettings: '"opsz" 144' }}
          >
            js80
          </div>
          <div className="text-[10.5px] text-muted mt-0.5">
            Tablero de leads
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-panel-2 border border-line rounded-md px-2.5 py-1.5 flex items-center gap-2 text-[12px] text-muted">
        <Search className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Buscar lead</span>
        <span className="ml-auto text-[10.5px] bg-white border border-line px-1.5 py-px rounded-sm text-muted-2">
          ⌘ K
        </span>
      </div>

      <NavSection
        title="Hoy"
        items={hoy}
        pathname={pathname}
        onItemClick={closeAll}
      />
      <NavSection
        title="Pipeline"
        items={pipeline}
        pathname={pathname}
        onItemClick={closeAll}
      />
      <NavSection
        title="Inteligencia"
        items={inteligencia}
        pathname={pathname}
        onItemClick={closeAll}
      />

      {/* Foot: user (demo: hardcodeado) */}
      <div className="mt-auto pt-3.5 border-t border-line flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-[11px]"
          style={{
            background: "linear-gradient(135deg, #8B6FFF, #5DC7E0)",
          }}
        >
          ML
        </div>
        <div className="text-[12px] leading-tight">
          <div className="font-semibold text-ink">Mariana López</div>
          <div className="text-muted text-[10.5px]">Comercial</div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  items,
  pathname,
  onItemClick,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onItemClick: () => void;
}) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold text-muted-2 tracking-[0.06em] uppercase mb-1.5 px-1.5">
        {title}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.href !== undefined && pathname === item.href;
        const content = (
          <>
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-muted"}`}
              strokeWidth={2}
            />
            <span className="text-left flex-1">{item.label}</span>
            {item.count !== undefined && (
              <span
                className={`
                  text-[10.5px] px-1.5 py-px rounded-full font-medium
                  ${
                    isActive
                      ? "bg-white/15 text-white"
                      : item.alert
                        ? "bg-rojo-soft text-rojo"
                        : "bg-line-2 text-muted"
                  }
                `}
              >
                {item.count === null ? "—" : item.count}
              </span>
            )}
          </>
        );
        const className = `
          w-full flex items-center gap-2.5 px-2 py-1.5 my-px rounded-md text-[12.5px] cursor-pointer transition
          ${isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-line-2"}
        `;
        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onItemClick}
              className={className}
            >
              {content}
            </Link>
          );
        }
        return (
          <button
            type="button"
            key={item.label}
            onClick={onItemClick}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
