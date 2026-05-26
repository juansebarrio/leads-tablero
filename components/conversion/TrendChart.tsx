import { formatMesAnio } from "@/lib/format";
import type { TrendPoint } from "@/lib/types";

interface TrendChartProps {
  data: TrendPoint[];
}

// SVG estático generado en server. Dibuja 2 series (creados/ganados) con
// curvas Bezier suaves y puntos en cada mes.
export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-16 text-muted text-[13px]">
        Sin data histórica todavía.
      </div>
    );
  }

  const maxCreados = Math.max(...data.map((d) => d.creados), 10);
  const maxGanados = Math.max(...data.map((d) => d.ganados), 5);
  const maxY = Math.max(maxCreados, maxGanados, 10);

  const W = 800;
  const H = 260;
  const PAD_L = 40;
  const PAD_R = 20;
  const PAD_T = 40;
  const PAD_B = 50;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  // Mapeo: index 0..N-1 → x. valor 0..maxY → y (invertido)
  const xs = data.map(
    (_, i) => PAD_L + (data.length === 1 ? chartW / 2 : (i * chartW) / (data.length - 1)),
  );
  const yFor = (v: number) => PAD_T + chartH - (v / maxY) * chartH;
  const ysCreados = data.map((d) => yFor(d.creados));
  const ysGanados = data.map((d) => yFor(d.ganados));

  // Path con curvas suaves entre puntos (Catmull-Rom simplificado).
  const smoothPath = (xs: number[], ys: number[]) => {
    if (xs.length === 0) return "";
    if (xs.length === 1) return `M ${xs[0]} ${ys[0]}`;
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const xPrev = xs[i - 1];
      const yPrev = ys[i - 1];
      const xCurr = xs[i];
      const yCurr = ys[i];
      const cpx = (xPrev + xCurr) / 2;
      d += ` Q ${cpx} ${yPrev} ${xCurr} ${yCurr}`;
    }
    return d;
  };

  const pathCreados = smoothPath(xs, ysCreados);
  const pathGanados = smoothPath(xs, ysGanados);
  // Área debajo de creados
  const areaCreados = `${pathCreados} L ${xs[xs.length - 1]} ${PAD_T + chartH} L ${xs[0]} ${PAD_T + chartH} Z`;

  // Líneas guía Y: 0, 25%, 50%, 75% del max
  const yGuides = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    val: Math.round(maxY * p),
    y: PAD_T + chartH - p * chartH,
  }));

  return (
    <div>
      <div className="flex gap-4 mb-4 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-azul" /> Leads creados
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-verde" /> Leads ganados
        </span>
      </div>
      <svg
        className="w-full h-[260px]"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Tendencia de leads creados y ganados por mes"
      >
        {/* Líneas guía horizontales */}
        {yGuides.map((g) => (
          <g key={g.val}>
            <line
              x1={PAD_L}
              y1={g.y}
              x2={W - PAD_R}
              y2={g.y}
              stroke="#F0EEE6"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 10}
              y={g.y + 4}
              textAnchor="end"
              fontFamily="Inter"
              fontSize="10"
              fill="#9A9AA3"
            >
              {g.val}
            </text>
          </g>
        ))}

        {/* X labels (meses) */}
        {data.map((d, i) => (
          <text
            key={d.mes}
            x={xs[i]}
            y={H - 18}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize="11"
            fill="#6B6B75"
            fontWeight="500"
          >
            {formatMesAnio(new Date(d.mes)).split(" ")[0]}
          </text>
        ))}

        {/* Área debajo de creados */}
        <path d={areaCreados} fill="var(--color-azul)" opacity={0.08} />

        {/* Línea creados (azul) */}
        <path
          d={pathCreados}
          stroke="var(--color-azul)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />

        {/* Línea ganados (verde) */}
        <path
          d={pathGanados}
          stroke="var(--color-verde)"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />

        {/* Puntos + valores */}
        {data.map((d, i) => {
          const isLast = i === data.length - 1;
          return (
            <g key={d.mes}>
              <circle
                cx={xs[i]}
                cy={ysCreados[i]}
                r={isLast ? 6 : 5}
                fill={isLast ? "var(--color-azul)" : "white"}
                stroke="var(--color-azul)"
                strokeWidth={isLast ? 2 : 2.5}
              />
              <text
                x={xs[i]}
                y={ysCreados[i] - 12}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={isLast ? 11.5 : 10.5}
                fill="var(--color-azul)"
                fontWeight={700}
              >
                {d.creados}
              </text>
              <circle
                cx={xs[i]}
                cy={ysGanados[i]}
                r={isLast ? 6 : 5}
                fill={isLast ? "var(--color-verde)" : "white"}
                stroke="var(--color-verde)"
                strokeWidth={isLast ? 2 : 2.5}
              />
              <text
                x={xs[i]}
                y={ysGanados[i] + 16}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={isLast ? 11.5 : 10.5}
                fill="var(--color-verde)"
                fontWeight={700}
              >
                {d.ganados}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
