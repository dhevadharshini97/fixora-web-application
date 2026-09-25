"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Inbox,
  Timer,
  TriangleAlert,
  BadgeCheck,
  MapPin,
  Wrench,
  Camera,
  ArrowUpCircle,
  ChevronRight,
  Users,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card, StatusPill, SeverityBadge } from "@/components/ui";
import { cn, deadlineInfo, isOpen, timeAgo } from "@/lib/utils";
import { ESCALATION_LEVELS } from "@/lib/constants";

export default function DepartmentPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [tab, setTab] = useState<"open" | "done">("open");
  const [busy, setBusy] = useState<number | null>(null);

  const load = () =>
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => setComplaints(d.complaints ?? []))
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const act = async (id: number, action: string) => {
    setBusy(id);
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } catch {}
    setBusy(null);
  };

  const open = useMemo(() => complaints.filter(isOpen), [complaints]);
  const done = useMemo(() => complaints.filter((c) => !isOpen(c)), [complaints]);
  const overdue = open.filter((c) => deadlineInfo(c).overdue);
  const list = (tab === "open" ? open : done);

  const stats = [
    { icon: Inbox, v: open.length, l: "Open cases", cls: "from-brand-600 to-brand-500" },
    { icon: Timer, v: open.filter((c) => !deadlineInfo(c).overdue).length, l: "Within SLA", cls: "from-teal-600 to-teal-500" },
    { icon: TriangleAlert, v: overdue.length, l: "Overdue", cls: "from-rose-600 to-orange-500" },
    { icon: BadgeCheck, v: done.length, l: "Resolved", cls: "from-emerald-600 to-emerald-500" },
  ];

  return (
    <div className="space-y-5">
      {/* banner */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-900 via-brand-900 to-teal-800 p-5 text-white">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white/15 p-3.5 backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-300">
              Department Console · Demo
            </p>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Roads & Civic Response — Ward 132
            </h1>
            <p className="mt-0.5 text-[11.5px] text-slate-300">
              Every action here updates citizen tracking in real time.
            </p>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-2.5">
        {stats.map((s, i) => (
          <motion.div key={s.l} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="p-3 text-center">
              <div className={`mx-auto mb-1.5 grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br ${s.cls} text-white`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="font-display text-lg font-bold leading-none text-slate-900">{s.v}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{s.l}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* tabs */}
      <div className="flex gap-2">
        {(["open", "done"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "rounded-full border px-5 py-2 text-xs font-bold transition",
              tab === k
                ? "border-slate-900 bg-slate-900 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-500"
            )}
          >
            {k === "open" ? `Inbox (${open.length})` : `Resolved (${done.length})`}
          </button>
        ))}
      </div>

      {/* list */}
      <div className="space-y-3">
        {list.map((c, i) => {
          const dl = deadlineInfo(c);
          const openC = isOpen(c);
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="p-3.5">
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.photoUrl || "/images/complaints/pothole.jpg"}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-[13.5px] font-bold text-slate-900">{c.title}</p>
                      <Link href={`/complaints/${c.id}`} className="shrink-0 text-slate-300 hover:text-brand-500">
                        <ChevronRight className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3 text-teal-600" />
                      {c.street} · {timeAgo(c.reportedAt)} · <Users className="h-3 w-3" /> {c.supporters}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={c.status} />
                      <SeverityBadge severity={c.severity} />
                      {openC && dl.overdue && (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[9.5px] font-black text-rose-500">
                          {dl.days}d overdue
                        </span>
                      )}
                      {(c.escalationLevel ?? 0) > 0 && openC && (
                        <span className="flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[9.5px] font-black text-orange-500">
                          <ArrowUpCircle className="h-2.5 w-2.5" />
                          {ESCALATION_LEVELS[Math.min(3, c.escalationLevel ?? 0)]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {openC && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      disabled={busy === c.id || c.status === "in_progress"}
                      onClick={() => act(c.id, "start")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[11.5px] font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      {c.status === "in_progress" ? "Work started" : "Start work"}
                    </button>
                    <button
                      disabled={busy === c.id}
                      onClick={() => act(c.id, "resolve")}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-[11.5px] font-bold text-white shadow-md shadow-teal-600/25 transition hover:opacity-95 disabled:opacity-40"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {busy === c.id ? "Uploading proof…" : "Resolve with proof"}
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Resolving attaches an after-photo, notifies the reporting citizen and starts the
        Citizen Verification window with 7-day & 30-day rechecks.
      </p>
    </div>
  );
}
