"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ScoreGauge({
  score,
  size = 210,
  label,
  sub,
}: {
  score: number;
  size?: number;
  label: string;
  sub?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = display / 100;

  const color =
    score >= 75 ? "#0d9488" : score >= 50 ? "#d97706" : "#e11d48";
  const trackColor = "#e2e8f0";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - c * frac}
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <motion.p
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-6xl font-bold tracking-tight"
            style={{ color }}
          >
            {display}
          </motion.p>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            / 100
          </p>
          <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
          {sub && <p className="text-[11px] font-medium text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
