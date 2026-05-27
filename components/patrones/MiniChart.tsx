import type { ChartData } from "@/lib/types";

interface Props {
  chart: ChartData;
}

// Mini gráfico inline para patrones tipo oportunidad ("mejor horario").
// SVG con stroke verde + label del pico. Render server, no animaciones.
export function MiniChart({ chart }: Props) {
  if (chart.tipo !== "mejor_horario") return null;
  const W = 200;
  const H = 60;
  const PADX = 10;
  const PADY = 12;
  const innerW = W - PADX * 2;
  const innerH = H - PADY * 2;
  const max = Math.max(chart.promedio, ...chart.datos.map((d) => d.valor), 1);

  // Posiciones x equidistantes; y mapeada al espacio interno (mayor=arriba).
  const points = chart.datos.map((d, i) => {
    const x = chart.datos.length === 1
      ? PADX + innerW / 2
      : PADX + (innerW * i) / (chart.datos.length - 1);
    const y = PADY + innerH - (innerH * d.valor) / max;
    return { x, y, d, i };
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
  const promedioY = PADY + innerH - (innerH * chart.promedio) / max;
  const pico = points.find((p) => p.d.highlight) ?? points[0];

  const unidad = chart.unidad ?? "%";

  return (
    <div className="bg-panel-2 border border-line-2 rounded-lg p-3.5 mt-1.5 mb-0.5 grid md:grid-cols-2 gap-3.5 items-center">
      <div className="text-[12px] text-ink-2 leading-[1.5]">
        <div className="mb-1">
          <strong className="font-bold">{pico.d.label}:</strong>{" "}
          <span className="text-verde font-bold">
            {pico.d.valor}
            {unidad}
          </span>
        </div>
        <div>
          <strong className="font-bold">Promedio general:</strong>{" "}
          {chart.promedio}
          {unidad}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-[60px]"
        aria-hidden
      >
        {/* Línea promedio */}
        <line
          x1={0}
          y1={promedioY}
          x2={W}
          y2={promedioY}
          stroke="#9A9AA3"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <text
          x={W - 4}
          y={promedioY - 3}
          fontFamily="Inter"
          fontSize={9}
          fill="#9A9AA3"
          textAnchor="end"
        >
          {chart.promedio}
          {unidad}
        </text>

        {/* Curva */}
        <path
          d={path}
          stroke="#3E8A5A"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Punto + label del pico */}
        <circle cx={pico.x} cy={pico.y} r={4} fill="#3E8A5A" />
        <text
          x={pico.x}
          y={Math.max(pico.y - 6, 8)}
          fontFamily="Inter"
          fontSize={10}
          fill="#3E8A5A"
          fontWeight={700}
          textAnchor="middle"
        >
          {pico.d.valor}
          {unidad}
        </text>

        {/* Labels eje X */}
        {points.map((p) => (
          <text
            key={p.i}
            x={p.x}
            y={H - 1}
            fontFamily="Inter"
            fontSize={8}
            fill={p.d.highlight ? "#3E8A5A" : "#9A9AA3"}
            fontWeight={p.d.highlight ? 700 : 400}
            textAnchor="middle"
          >
            {chart.labels[p.i] ?? p.d.label.slice(0, 1)}
          </text>
        ))}
      </svg>
    </div>
  );
}
