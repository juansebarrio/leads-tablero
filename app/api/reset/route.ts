/**
 * Endpoint del cron diario. Lo llama Vercel todos los días a las 06:00 UTC
 * (03:00 ART) con el header `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Borra y reinserta toda la data demo, con fechas relativas a now().
 */

import { NextResponse } from "next/server";
import { detectarPatrones } from "@/lib/patrones-detectores";
import { resetAndSeed } from "@/lib/seed";

// El endpoint nunca debe ser cacheado.
export const dynamic = "force-dynamic";
// El reset puede demorar varios segundos: damos margen razonable.
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no configurado" },
      { status: 500 },
    );
  }
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const started = Date.now();
    const result = await resetAndSeed();
    // Detectores de patrones — corren contra los datos recién sembrados.
    // Si fallan, no abortamos el reset: la pantalla /patrones los reintenta
    // on-demand cuando alguien entra.
    try {
      await detectarPatrones();
    } catch (errInsights) {
      console.warn("[reset] detectarPatrones falló:", errInsights);
    }
    const ms = Date.now() - started;
    return NextResponse.json({ ok: true, ms, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
