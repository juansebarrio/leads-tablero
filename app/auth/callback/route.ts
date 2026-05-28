import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth callback: recibe el code de Google, lo cambia por sesión, valida
// que el usuario tenga membership en alguna org, y redirige a `next`.
// Si falla cualquier paso, redirige a /auth/error con el mensaje.
//
// Membership pendiente (sin fila en usuarios_organizaciones) = sign out y
// redirect al error. Sprint 8 va a sumar las membresías de los usuarios
// autorizados (juansegundo@js80.studio, julian@js80.studio).

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?msg=${encodeURIComponent("No se recibió código de autorización")}`,
    );
  }

  const supabase = await createClient();
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/auth/error?msg=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/auth/error?msg=${encodeURIComponent("No se pudo recuperar el usuario")}`,
    );
  }

  const { data: membership } = await supabase
    .from("usuarios_organizaciones")
    .select("organizacion_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!membership) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/auth/error?msg=${encodeURIComponent("Tu cuenta no tiene acceso autorizado. Contactá a juansegundo@js80.studio.")}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
