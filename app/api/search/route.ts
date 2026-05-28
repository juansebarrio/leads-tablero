// Endpoint de búsqueda global. Lo consume el command palette (⌘K).
// 3 queries en paralelo: leads (por nombre), comerciales (por nombre),
// contactos (por nota). Devuelve listas acotadas por tipo.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type SearchResult = {
  leads: SearchLead[];
  comerciales: SearchComercial[];
  notas: SearchNota[];
};

export type SearchLead = {
  id: string;
  nombre: string;
  estado: string;
  valor_estimado: number;
  responsable_nombre: string | null;
  responsable_iniciales: string | null;
  responsable_avatar: string | null;
  motivo_perdida: string | null;
};

export type SearchComercial = {
  id: string;
  nombre: string;
  iniciales: string;
  avatar_gradient: string;
};

export type SearchNota = {
  id: string;
  lead_id: string;
  lead_nombre: string;
  canal: string;
  fecha: string;
  nota: string;
};

const EMPTY: SearchResult = { leads: [], comerciales: [], notas: [] };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 1) return NextResponse.json(EMPTY);

  // Escapamos los wildcards del ilike pattern para no exponer search injection.
  const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;

  const user = await getCurrentUser();
  const supabase = await createClient();
  let leadsRes, comercialesRes, notasRes;
  try {
    [leadsRes, comercialesRes, notasRes] = await Promise.all([
      supabase
        .from("leads")
        .select(
          "id, nombre, estado, valor_estimado, motivo_perdida, comerciales:responsable_id(nombre, iniciales, avatar_gradient)",
        )
        .eq("organizacion_id", user.organizacion_id)
        .ilike("nombre", pattern)
        .limit(8),
      supabase
        .from("comerciales")
        .select("id, nombre, iniciales, avatar_gradient")
        .eq("organizacion_id", user.organizacion_id)
        .ilike("nombre", pattern)
        .limit(5),
      supabase
        .from("contactos")
        .select("id, lead_id, canal, fecha, nota, leads:lead_id(nombre)")
        .eq("organizacion_id", user.organizacion_id)
        .ilike("nota", pattern)
        // Eventos internos no son notas reales para el usuario.
        .not("canal", "in", '("cambio_estado","reasignacion")')
        .limit(5),
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `search threw: ${message}` }, { status: 500 });
  }

  if (leadsRes.error) {
    return NextResponse.json(
      { error: leadsRes.error.message },
      { status: 500 },
    );
  }
  if (comercialesRes.error) {
    return NextResponse.json(
      { error: comercialesRes.error.message },
      { status: 500 },
    );
  }
  if (notasRes.error) {
    return NextResponse.json(
      { error: notasRes.error.message },
      { status: 500 },
    );
  }

  type RawLead = {
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
  type RawNota = {
    id: string;
    lead_id: string;
    canal: string;
    fecha: string;
    nota: string;
    leads: { nombre: string } | { nombre: string }[] | null;
  };

  const leads: SearchLead[] = ((leadsRes.data ?? []) as unknown as RawLead[]).map(
    (l) => {
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
    },
  );

  const notas: SearchNota[] = ((notasRes.data ?? []) as unknown as RawNota[]).map(
    (n) => {
      const lead = Array.isArray(n.leads) ? (n.leads[0] ?? null) : n.leads;
      return {
        id: n.id,
        lead_id: n.lead_id,
        lead_nombre: lead?.nombre ?? "(lead borrado)",
        canal: n.canal,
        fecha: n.fecha,
        nota: n.nota,
      };
    },
  );

  return NextResponse.json({
    leads,
    comerciales: comercialesRes.data ?? [],
    notas,
  });
}
