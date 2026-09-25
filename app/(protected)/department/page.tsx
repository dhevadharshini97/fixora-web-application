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
  Droplets,
  Zap,
  Trash2,
  Shield,
  Road,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card, StatusPill, SeverityBadge } from "@/components/ui";
import { cn, deadlineInfo, isOpen, timeAgo } from "@/lib/utils";
import { ESCALATION_LEVELS } from "@/lib/constants";

type DepartmentKey =
  | "All Departments"
  | "Roads & Infrastructure"
  | "Water Supply"
  | "Electricity"
  | "Sanitation"
  | "Public Safety";

const departments: {
  name: DepartmentKey;
  icon: typeof Road;
  categories: string[];
  accent: string;
}[] = [
  { name: "All Departments", icon: Building2, categories: [], accent: "from-brand-600 to-teal-500" },
  { name: "Roads & Infrastructure", icon: Road, categories: ["Road", "Pothole", "Street Light", "Drainage"], accent: "from-blue-600 to-cyan-500" },
  { name: "Water Supply", icon: Droplets, categories: ["Water", "Pipeline", "Leakage"], accent: "from-cyan-600 to-sky-500" },
  { name: "Electricity", icon: Zap, categories: ["Electricity", "Power", "Transformer"], accent: "from-amber-500 to-orange-500" },
  { name: "Sanitation", icon: Trash2, categories: ["Garbage", "Waste", "Sanitation"], accent: "from-emerald-600 to-lime-500" },
  { name: "Public Safety", icon: Shield, categories: ["Safety", "Street Safety", "Public Safety"], accent: "from-violet-600 to-fuchsia-500" },
];

function belongsToDepartment(c: Complaint, department: DepartmentKey) {
  if (department === "All Departments") return true;
  if (c.department === department) return true;
  const value = (c.department || c.category || "").toLowerCase();
  const config = departments.find((d) => d.name === department);
  return !!config?.categories.some((x) => value.includes(x.toLowerCase()));
}

export default function DepartmentPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [department, setDepartment] = useState<DepartmentKey>("All Departments");
  const [tab, setTab] = useState<"open" | "done">("open");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/complaints", { cache: "no-store" });
      const d = await r.json();
      setComplaints(d.complaints ?? []);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const departmentComplaints = useMemo(
    () => complaints.filter((c) => belongsToDepartment(c, department)),
    [complaints, department]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departmentComplaints.filter((c) => {
      if (!q) return true;
      return [c.title, c.description, c.street, c.category, c.citizenName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [departmentComplaints, query]);

  const open = filtered.filter(isOpen);
  const done = filtered.filter((c) => !isOpen(c));
  const overdue = open.filter((c) => deadlineInfo(c).overdue);
  const list = tab === "open" ? open : done;

  const counts = useMemo(
    () =>
      departments.map((d) => ({
        ...d,
        count: complaints.filter((c) => belongsToDepartment(c, d.name)).filter(isOpen).length,
      })),
    [complaints]
  );

  const selected = departments.find((d) => d.name === department) ?? departments[0];

  const stats = [
    { icon: Inbox, v: open.length, l: "Open cases", cls: "from-brand-600 to-brand-500" },
    { icon: Timer, v: open.filter((c) => !deadlineInfo(c).overdue).length, l: "Within SLA", cls: "from-teal-600 to-teal-500" },
    { icon: TriangleAlert, v: overdue.length, l: "Overdue", cls: "from-rose-600 to-orange-500" },
    { icon: BadgeCheck, v: done.length, l: "Resolved", cls: "from-emerald-600 to-emerald-500" },
  ];

  const act = async (id: number, action: string) => {
    setBusy(id);
    try {
      await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-slate-950 via-brand-950 to-teal-900 p-5 text-white">
        <div className="absolute inset-0 grid-bg opacity-15" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${selected.accent} shadow-lg`}>
              <selected.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-300">
                FIXORA · Department Console
              </p>
              <h1 className="font-display text-xl font-bold tracking-tight">
                {department === "All Departments" ? "Civic Operations Center" : department}
              </h1>
              <p className="mt-0.5 text-[11.5px] text-slate-300">
                AI-routed complaints are monitored, assigned and resolved from one place.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15 disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sync complaints
          </button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((d) => (
          <button
            key={d.name}
            onClick={() => setDepartment(d.name)}
            className={cn(
              "rounded-2xl border p-3 text-left transition",
              department === d.name
                ? "border-brand-300 bg-brand-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}
          >
            <div className="flex items-center justify-between">
              <d.icon className={cn("h-4 w-4", department === d.name ? "text-brand-600" : "text-slate-400")} />
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">
                {d.count}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-[10.5px] font-bold leading-tight text-slate-700">
              {d.name}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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

      <Card className="p-3">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search complaint, street, category or citizen..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            {department}
          </div>
        </div>
      </Card>

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

      <div className="space-y-3">
        {list.map((c, i) => {
          const dl = deadlineInfo(c);
          const openC = isOpen(c);
          return (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-3.5">
                <div className="flex gap-3">
                  <img
                    src={c.photoUrl || "/images/complaints/pothole.jpg"}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="line-clamp-1 text-[13.5px] font-bold text-slate-900">{c.title}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-brand-600">
                          {c.department || c.category}
                        </p>
                      </div>
                      <Link href={`/complaints/${c.id}`} className="shrink-0 text-slate-300 hover:text-brand-500">
                        <ChevronRight className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="h-3 w-3 text-teal-600" />
                      {c.street || "Location unavailable"} · {timeAgo(c.reportedAt)} ·
                      <Users className="h-3 w-3" /> {c.supporters ?? 1}
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
                      {busy === c.id ? "Updating…" : "Resolve with proof"}
                    </button>
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}

        {list.length === 0 && (
          <Card className="p-10 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-slate-700">No complaints in this view</p>
            <p className="mt-1 text-xs text-slate-400">
              Try another department, clear the search, or sync the complaint queue.
            </p>
          </Card>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-400">
        Department actions update citizen tracking. Resolved cases can carry proof photos and enter the citizen verification flow.
      </p>
    </div>
  );
}
