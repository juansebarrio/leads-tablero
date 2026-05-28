import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Modo demo: la vitrina pública no usa auth, deja pasar todo.
// Modo production: redirige a /login cualquier ruta no-pública sin sesión.
//
// /login y /auth/callback se crean en Sprint 5.

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "demo";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/api/reset", // cron con Bearer; el middleware no maneja Authorization, lo dejamos pasar.
];

export async function middleware(request: NextRequest) {
  // ─── MODO DEMO: pass-through ───
  if (APP_MODE === "demo") {
    return NextResponse.next();
  }

  // ─── MODO PRODUCTION ───
  const isPublic = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );
  if (isPublic) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() refresca la sesión si está por expirar. NO usar getSession()
  // acá — no valida el token contra Supabase y puede aceptar cookies stale.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.webp$).*)",
  ],
};
