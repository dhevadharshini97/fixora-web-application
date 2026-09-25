"use client";

import { useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";

export default function BeforeAfter({
  before,
  after,
  height = 230,
}: {
  before: string;
  after: string;
  height?: number;
}) {
  const [pos, setPos] = useState(52);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const set = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(4, Math.min(96, p)));
  };

  return (
    <div
      ref={ref}
      className="relative w-full select-none overflow-hidden rounded-2xl border border-slate-200"
      style={{ height, touchAction: "none" }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        set(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && set(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt="after" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt="before"
          className="absolute inset-0 h-full object-cover"
          style={{ width: ref.current?.clientWidth || "100vw", maxWidth: "none" }}
        />
      </div>
      <div
        className="absolute inset-y-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]"
        style={{ left: `calc(${pos}% - 2px)` }}
      >
        <div className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-slate-100 bg-white text-slate-600 shadow-xl">
          <ChevronsLeftRight className="h-5 w-5" />
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
        Before
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-teal-600/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
        After
      </span>
    </div>
  );
}
