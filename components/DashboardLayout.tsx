import { AgendaPanel } from "@/components/AgendaPanel";
import { Backdrop } from "@/components/Backdrop";
import { DrawerProvider } from "@/components/drawer-context";
import { NuevoLeadDrawer } from "@/components/NuevoLeadLauncher";
import { RegistrarContactoDrawer } from "@/components/RegistrarContactoLauncher";
import { SidebarLeft, type SidebarCounts } from "@/components/SidebarLeft";
import { TopbarMobile } from "@/components/TopbarMobile";
import type { CurrentUser } from "@/lib/auth";
import type { EventoAgenda } from "@/lib/types";

interface DashboardLayoutProps {
  agendaEvents: EventoAgenda[];
  sidebarCounts?: SidebarCounts;
  cierreMes?: React.ComponentProps<typeof AgendaPanel>["cierreMes"];
  currentUser: CurrentUser;
  mainClassName?: string;
  children: React.ReactNode;
}

const DEFAULT_MAIN =
  "px-4 py-5 md:px-6 md:py-7 lg:px-8 lg:py-7 pb-16 min-w-0";

// Shell del tablero. Server Component que envuelve la app en DrawerProvider
// (Client) y arma el grid principal.
//
// La agenda y los forms de Nuevo lead / Registrar contacto viven fuera del
// grid como overlays globales. Esto unifica el UX en todos los breakpoints
// (todo es drawer, no hay sticky/panel mixto).
export function DashboardLayout({
  agendaEvents,
  sidebarCounts,
  cierreMes,
  currentUser,
  mainClassName = DEFAULT_MAIN,
  children,
}: DashboardLayoutProps) {
  return (
    <DrawerProvider>
      <TopbarMobile agendaCount={agendaEvents.length} />
      <Backdrop />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] min-h-screen">
        <SidebarLeft counts={sidebarCounts} currentUser={currentUser} />
        <main className={mainClassName}>{children}</main>
      </div>

      {/* Overlays globales: un solo mount por drawer, mutual exclusion
          garantizada por el DrawerProvider. */}
      <AgendaPanel events={agendaEvents} cierreMes={cierreMes} />
      <NuevoLeadDrawer />
      <RegistrarContactoDrawer />
    </DrawerProvider>
  );
}
