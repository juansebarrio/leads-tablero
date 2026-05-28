// Página de error del flujo OAuth. La llaman /auth/callback (cuando algo
// falla) y /login (cuando signInWithOAuth devuelve error antes de redirigir).
// El mensaje viaja por query string (?msg=...).

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const { msg } = await searchParams;
  const message = msg || "Ocurrió un error al intentar autenticarte.";

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-bg, #F7F6F2)" }}
    >
      <div className="max-w-md w-full px-8 py-12">
        <div className="mb-8">
          <div
            className="text-xs uppercase tracking-[0.16em] font-semibold mb-4"
            style={{ color: "var(--color-muted, #6B6B75)" }}
          >
            No pudimos completar el ingreso
          </div>
          <h1
            className="text-[32px] leading-tight mb-5"
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 500,
              color: "var(--color-ink, #0E0E12)",
            }}
          >
            Algo no{" "}
            <em
              style={{
                fontStyle: "italic",
                color: "var(--color-violeta, #8B6FFF)",
              }}
            >
              salió bien
            </em>
            .
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-muted, #6B6B75)" }}
          >
            {message}
          </p>
        </div>
        <a
          href="/login"
          className="inline-block px-6 py-3 rounded-lg transition-opacity"
          style={{
            background: "var(--color-ink, #0E0E12)",
            color: "white",
          }}
        >
          Volver al login
        </a>
        <p
          className="text-xs mt-8 leading-relaxed"
          style={{ color: "var(--color-muted, #6B6B75)" }}
        >
          ¿Pensás que esto es un error? Escribí a juansegundo@js80.studio.
        </p>
      </div>
    </div>
  );
}
