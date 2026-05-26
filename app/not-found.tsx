import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6 bg-bg">
      <div className="max-w-md text-center">
        <p
          className="font-display italic text-7xl text-violeta font-medium"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          404
        </p>
        <h1
          className="font-display text-2xl md:text-3xl mt-3 font-medium -tracking-[0.02em] text-ink"
          style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
        >
          No encontramos esa{" "}
          <em className="italic text-violeta">página</em>.
        </h1>
        <p className="text-muted mt-3 text-[13.5px]">
          Puede que el link esté roto o que la página ya no exista.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 mt-6 bg-ink text-white border border-ink px-4 py-2.5 rounded-md font-medium text-[13px] hover:bg-violeta hover:border-violeta transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
          Volver al tablero
        </Link>
      </div>
    </main>
  );
}
