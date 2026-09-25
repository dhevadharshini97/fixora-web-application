"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrafficCone,
  Waves,
  Trash2,
  Lightbulb,
  Droplets,
  Sparkles,
  TrendingUp,
  Camera,
  TriangleAlert,
  HeartPulse,
  Info,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card, Btn, SeverityBadge } from "@/components/ui";
import ScoreGauge from "@/components/score-gauge";
import { useI18n } from "@/lib/i18n";
import computeStreetHealth from "@/lib/street";
import { cn, deadlineInfo, isOpen, timeAgo } from "@/lib/utils";

const METRIC_ICONS: Record<string, typeof TrafficCone> = {
  roads: TrafficCone,
  drainage: Waves,
  garbage: Trash2,
  streetlights: Lightbulb,
  water: Droplets,
  cleanliness: Sparkles,
};

const METRIC_BAR: Record<string, string> = {
  roads: "from-brand-600 to-brand-400",
  drainage: "from-cyan-600 to-cyan-400",
  garbage: "from-orange-500 to-amber-400",
  streetlights: "from-yellow-500 to-amber-300",
  water: "from-sky-600 to-sky-400",
  cleanliness: "from-teal-600 to-emerald-400",
};

const RANKS = [
  { name: "Ashok Nagar", score: 81 },
  { name: "K.K. Nagar", score: 78 },
  { name: "Anna Nagar", score: 75 },
  { name: "Adyar", score: 71 },
  { name: "T. Nagar", score: 68, you: true },
  { name: "Velachery", score: 64 },
];

export default function StreetCarePage() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => {
        setComplaints(d.complaints ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const health = useMemo(() => computeStreetHealth(complaints), [complaints]);
  const offenders = useMemo(
    () =>
      complaints
        .filter(isOpen)
        .sort((a, b) => {
          const sevW = (s: string) => (s === "Critical" ? 4 : s === "High" ? 3 : s === "Medium" ? 2 : 1);
          return sevW(b.severity) - sevW(a.severity);
        })
        .slice(0, 3),
    [complaints]
  );

  const grade =
    health.overall >= 75
      ? { label: "Good · improving", color: "text-teal-600", bg: "bg-teal-50 border-teal-200" }
      : health.overall >= 50
      ? { label: "Fair · needs attention", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" }
      : { label: "Poor · urgent", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {t("navStreet")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{t("streetDesc")}</p>
      </div>

      {/* gauge */}
      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-50" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-brand-50" />
        <div className="relative flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2 self-start">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white">
              <HeartPulse className="h-4 w-4" />
            </span>
            <h2 className="font-display text-base font-bold text-slate-900">{t("streetHealthScore")}</h2>
          </div>
          {loading ? (
            <div className="h-[210px] w-[210px] animate-pulse rounded-full bg-slate-100" />
          ) : (
            <ScoreGauge score={health.overall} label="T. Nagar" sub={grade.label} size={220} />
          )}
          <div className={cn("mt-4 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold", grade.bg, grade.color)}>
            <TrendingUp className="h-3.5 w-3.5" />
            +4 points this month · 12 fixes verified
          </div>
          <p className="mt-3 flex max-w-sm items-start gap-1.5 text-center text-[11px] leading-relaxed text-slate-400">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Computed live from open, overdue and recurring reports across roads, drainage, garbage,
            streetlights, water and cleanliness.
          </p>
        </div>
      </Card>

      {/* metric bars */}
      <Card className="space-y-4 p-5">
        {health.rows.map((m, i) => {
          const Icon = METRIC_ICONS[m.id] ?? Sparkles;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="flex items-center gap-2 text-[13px] font-bold text-slate-700">
                  <Icon className="h-4 w-4 text-slate-400" />
                  {t(m.id)}
                  {m.open > 0 && (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[9px] font-black text-rose-500">
                      {m.open} open
                    </span>
                  )}
                </p>
                <p className="font-display text-sm font-bold text-slate-800">
                  {m.score}
                  <span className="text-[10px] font-semibold text-slate-400">/100</span>
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${m.score}%` }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={cn("h-full rounded-full bg-gradient-to-r", METRIC_BAR[m.id])}
                />
              </div>
            </motion.div>
          );
        })}
      </Card>

      {/* what's hurting the street */}
      <div>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-slate-900">
          What is pulling your score down
        </h2>
        <div className="space-y-2.5">
          {offenders.map((c, i) => {
            const dl = deadlineInfo(c);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/complaints/${c.id}`}>
                  <Card className="flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photoUrl || "/images/complaints/pothole.jpg"} alt="" className="h-13 w-13 shrink-0 rounded-2xl object-cover" style={{ height: 52, width: 52 }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-slate-800">{c.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {timeAgo(c.reportedAt)} ·{" "}
                        {dl.overdue ? (
                          <span className="font-bold text-rose-500">{dl.days}d {t("overdue")}</span>
                        ) : (
                          <span className="font-semibold text-teal-600">{dl.days} {t("daysLeft")}</span>
                        )}
                      </p>
                    </div>
                    <SeverityBadge severity={c.severity} />
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-brand-700 to-teal-600 p-5 text-white shadow-2xl shadow-brand-600/25">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white/15 p-3.5 backdrop-blur">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-display text-base font-bold">Spotted something broken?</p>
            <p className="text-[12px] text-blue-100/90">Every verified fix raises this street's score.</p>
          </div>
          <Link href="/report">
            <Btn variant="dark" className="bg-white/15 px-4 py-2.5 text-xs backdrop-blur hover:bg-white/25">
              <Camera className="h-4 w-4" /> {t("reportNow")}
            </Btn>
          </Link>
        </div>
      </div>

      {/* street leaderboard */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-base font-bold text-slate-900">Neighbourhood leaderboard</h2>
        <div className="space-y-2">
          {RANKS.map((r, i) => (
            <div
              key={r.name}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                r.you ? "border border-brand-200 bg-brand-50/70" : "bg-slate-50/60"
              )}
            >
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-lg text-[11px] font-black",
                  i === 0 ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {i + 1}
              </span>
              <p className="flex-1 text-[13px] font-bold text-slate-700">
                {r.name}
                {r.you && <span className="ml-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">You</span>}
              </p>
              <p className="font-display text-sm font-bold text-slate-800">{r.score}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
