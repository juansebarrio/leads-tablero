import { AgendaPanel } from "@/components/AgendaPanel";
import { Backdrop } from "@/components/Backdrop";
import { DrawerProvider } from "@/components/drawer-context";
import { SidebarLeft, type SidebarCounts } from "@/components/SidebarLeft";
import { TopbarMobile } from "@/components/TopbarMobile";
import type { EventoAgenda } from "@/lib/types";

interface DashboardLayoutProps {
  agendaEvents: EventoAgenda[];
  sidebarCounts?: SidebarCounts;
  cierreMes?: React.ComponentProps<typeof AgendaPanel>["cierreMes"];
  children: React.ReactNode;
}

// Shell del tablero. Server Component que sólo envuelve la árbol en el
// DrawerProvider (Client) y arma el grid principal.
export function DashboardLayout({
  agendaEvents,
  sidebarCounts,
  cierreMes,
  children,
}: DashboardLayoutProps) {
  return (
    <DrawerProvider>
      <TopbarMobile agendaCount={agendaEvents.length} />
      <Backdrop />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[220px_1fr_280px] min-h-screen">
        <SidebarLeft counts={sidebarCounts} />
        <main className="px-4 py-5 md:px-6 md:py-7 lg:px-8 lg:py-7 pb-16 min-w-0">
          {children}
        </main>
        <AgendaPanel events={agendaEvents} cierreMes={cierreMes} />
      </div>
    </DrawerProvider>
  );
}
