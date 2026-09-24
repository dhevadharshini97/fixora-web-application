"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Camera,
  TriangleAlert,
  HeartPulse,
  ArrowRight,
  MapPin,
  GitBranch,
  Timer,
  ArrowUpCircle,
  BadgeCheck,
  CalendarCheck,
  Repeat,
  BrainCircuit,
  ShieldCheck,
  Fingerprint,
  Sparkles,
  Eye,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import ComplaintCard from "@/components/complaint-card";
import computeStreetHealth from "@/lib/street";
import { useI18n } from "@/lib/i18n";
import { getProfile, greetingKey, isOpen } from "@/lib/utils";

const FEATURES = [
  { icon: GitBranch, label: "Smart Department Routing" },
  { icon: Timer, label: "Smart Resolution Deadline" },
  { icon: ArrowUpCircle, label: "Auto Overdue Escalation" },
  { icon: BadgeCheck, label: "Citizen Verification" },
  { icon: Eye, label: "Before / After Proof" },
  { icon: CalendarCheck, label: "7 & 30-Day Rechecks" },
  { icon: Repeat, label: "Recurring Problem Detection" },
  { icon: BrainCircuit, label: "Root-Cause AI" },
  { icon: HeartPulse, label: "Street Health Score" },
  { icon: Fingerprint, label: "Problem DNA" },
  { icon: ShieldCheck, label: "Privacy AI" },
  { icon: Sparkles, label: "FIXORA AI Assistant" },
];

export default function HomePage() {
  const { t } = useI18n();
  const [name, setName] = useState("Citizen");
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [myIds, setMyIds] = useState<number[]>([]);

  useEffect(() => {
    const p = getProfile();
    if (p?.fullName) setName(p.fullName.split(" ")[0]);
    try {
      setMyIds(JSON.parse(localStorage.getItem("fixora_my_complaints") ?? "[]"));
    } catch {}
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => setComplaints(d.complaints ?? []))
      .catch(() => {});
  }, []);

  const openCount = complaints.filter(isOpen).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved" || c.status === "verified"
  ).length;
  const health = computeStreetHealth(complaints);

  const near = complaints.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white shadow-2xl shadow-brand-600/30"
      >
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal-200">
                {t(greetingKey())}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
                {name}
              </h1>
              <p className="mt-2 max-w-[240px] text-[13px] leading-relaxed text-blue-100/90">
                {t("dashSub")}
              </p>
            </div>
            {/* radar mini-map */}
            <div className="relative mt-1 grid h-24 w-24 shrink-0 place-items-center">
              {[36, 62, 88].map((s, i) => (
                <motion.span
                  key={s}
                  className="absolute rounded-full border border-white/25"
                  style={{ width: s, height: s }}
                  animate={{ opacity: [0.7, 0.25, 0.7] }}
                  transition={{ duration: 3 + i, repeat: Infinity }}
                />
              ))}
              <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-teal-300" />
              <MapPin className="relative h-6 w-6 text-white" fill="#fff3" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2.5">
            {[
              { icon: ClipboardList, v: String(myIds.length), l: t("reports") },
              { icon: TriangleAlert, v: String(openCount), l: t("openNow") },
              { icon: CheckCircle2, v: String(resolvedCount), l: t("stResolved") },
            ].map(({ icon: Icon, v, l }) => (
              <div
                key={l}
                className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-teal-200">
                  <Icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{l}</span>
                </div>
                <p className="mt-0.5 font-display text-2xl font-bold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Three main sections */}
      <section className="space-y-3.5">
        {[
          {
            href: "/report",
            icon: Camera,
            title: t("reportTitle"),
            desc: t("reportDesc"),
            grad: "from-brand-600 to-brand-500",
            shadow: "shadow-brand-600/30",
            delay: 0.08,
            pill: "AI",
          },
          {
            href: "/unresolved",
            icon: TriangleAlert,
            title: t("navUnresolved"),
            desc: t("unresolvedDesc"),
            grad: "from-rose-600 to-orange-500",
            shadow: "shadow-rose-600/25",
            delay: 0.16,
            pill: `${openCount}`,
          },
          {
            href: "/street-care",
            icon: HeartPulse,
            title: t("navStreet"),
            desc: t("streetDesc"),
            grad: "from-teal-600 to-emerald-500",
            shadow: "shadow-teal-600/25",
            delay: 0.24,
            pill: `${health.overall}/100`,
          },
        ].map((s) => (
          <motion.div
            key={s.href}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: s.delay }}
          >
            <Link
              href={s.href}
              className="group flex items-center gap-4 rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_34px_-14px_rgba(20,78,221,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-14px_rgba(20,78,221,0.28)]"
            >
              <div
                className={`grid h-15 w-15 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br p-4 text-white shadow-lg ${s.grad} ${s.shadow}`}
              >
                <s.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[17px] font-bold tracking-tight text-slate-900">
                    {s.title}
                  </h2>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black text-slate-500">
                    {s.pill}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-slate-500">{s.desc}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-brand-600 group-hover:text-white">
                <ArrowRight className="h-4.5 w-4.5" />
              </span>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Live near you */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-teal-500" />
            </span>
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
              {t("liveNearYou")}
            </h2>
          </div>
          <Link href="/unresolved" className="text-xs font-bold text-brand-600 hover:text-brand-700">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="space-y-3">
          {near.map((c, i) => (
            <ComplaintCard key={c.id} complaint={c} index={i} compact />
          ))}
        </div>
      </motion.section>

      {/* Smart features marquee */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="-mx-4 overflow-hidden"
      >
        <p className="mb-3 px-4 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
          FIXORA AI Engine · 12 smart features
        </p>
        <div className="relative">
          <div className="animate-marquee flex w-max gap-2.5 px-2">
            {[...FEATURES, ...FEATURES].map((f, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-bold text-slate-600 shadow-sm"
              >
                <f.icon className="h-3.5 w-3.5 text-teal-600" />
                {f.label}
              </span>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#f4f8fd] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#f4f8fd] to-transparent" />
        </div>
      </motion.section>
    </div>
  );
}
