"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const handleGoogleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setLoading(false);
      window.location.href = `/auth/error?msg=${encodeURIComponent(error.message)}`;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-bg, #F7F6F2)" }}
    >
      <div className="max-w-sm w-full px-8 py-12">
        <div className="mb-12">
          <h1
            className="text-[40px] leading-none mb-3"
            style={{
              fontFamily: "var(--font-fraunces), serif",
              fontWeight: 500,
              color: "var(--color-ink, #0E0E12)",
            }}
          >
            Tablero{" "}
            <em
              style={{
                fontStyle: "italic",
                color: "var(--color-azul, #6B8CFF)",
              }}
            >
              JS80
            </em>
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-muted, #6B6B75)" }}
          >
            Entrá con tu cuenta de Google de JS80 para acceder al tablero
            interno.
          </p>
        </div>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full px-6 py-3.5 rounded-lg flex items-center justify-center gap-3 transition-opacity disabled:opacity-50"
          style={{
            background: "var(--color-ink, #0E0E12)",
            color: "white",
          }}
        >
          {loading ? (
            "Redirigiendo a Google..."
          ) : (
            <>
              <GoogleIcon />
              <span>Entrar con Google</span>
            </>
          )}
        </button>
        <p
          className="text-xs mt-8 leading-relaxed"
          style={{ color: "var(--color-muted, #6B6B75)" }}
        >
          Solo cuentas autorizadas pueden ingresar. Si tu cuenta no tiene
          acceso, contactá a juansegundo@js80.studio.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen"
          style={{ background: "var(--color-bg, #F7F6F2)" }}
        />
      }
    >
      <LoginContent />
    </Suspense>
  );
}
