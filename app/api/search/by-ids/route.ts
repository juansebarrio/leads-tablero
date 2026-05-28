// Hidrata un set de lead ids (por ejemplo, los recientes del localStorage)
// devolviendo el shape de SearchLead — para que el command palette muestre
// la info completa sin guardar todo en client.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SearchLead } from "@/app/api/search/route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ leads: [] });
  }

  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, nombre, estado, valor_estimado, motivo_perdida, comerciales:responsable_id(nombre, iniciales, avatar_gradient)",
    )
    .eq("organizacion_id", user.organizacion_id)
    .in("id", ids);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    nombre: string;
    estado: string;
    valor_estimado: number;
    motivo_perdida: string | null;
    comerciales:
      | { nombre: string; iniciales: string; avatar_gradient: string }
      | { nombre: string; iniciales: string; avatar_gradient: string }[]
      | null;
  };

  const leads: SearchLead[] = ((data ?? []) as unknown as Row[]).map((l) => {
    const com = Array.isArray(l.comerciales)
      ? (l.comerciales[0] ?? null)
      : l.comerciales;
    return {
      id: l.id,
      nombre: l.nombre,
      estado: l.estado,
      valor_estimado: Number(l.valor_estimado) || 0,
      motivo_perdida: l.motivo_perdida,
      responsable_nombre: com?.nombre ?? null,
      responsable_iniciales: com?.iniciales ?? null,
      responsable_avatar: com?.avatar_gradient ?? null,
    };
  });

  return NextResponse.json({ leads });
}
