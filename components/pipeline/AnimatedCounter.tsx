"use client";

import { animate, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  // duración del tween en segundos
  duration?: number;
}

// Counter animado que tweens entre valores. Pattern Stripe.
export function AnimatedCounter({
  value,
  format = (n) => Math.round(n).toString(),
  className,
  duration = 0.55,
}: AnimatedCounterProps) {
  const mv = useMotionValue(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Si el ref ya tiene el valor final (primer render), no animar.
    if (ref.current && ref.current.textContent === format(value)) return;
    const controls = animate(mv, value, { duration, ease: [0.4, 0, 0.2, 1] });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [value, mv, format, duration]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}

// Formatos comunes reutilizables.
export const formatUSDCounter = (n: number) =>
  `USD ${Math.round(n).toLocaleString("es-AR")}`;

export const formatInt = (n: number) => Math.round(n).toString();
