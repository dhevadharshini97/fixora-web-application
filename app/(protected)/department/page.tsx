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
  X,
  CheckCircle2,
  Clock3,
  BrainCircuit,
  UserRound,
  ClipboardCheck,
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
  const [statusFilter, setStatusFilter] = useState<"all" | "critical" | "overdue">("all");
  const [busy, setBusy] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [assignedOfficer, setAssignedOfficer] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const load = async () => {
    setLoading(true);
    let local: Complaint[] = [];
    try {
      local = JSON.parse(localStorage.getItem("fixora_local_complaints") ?? "[]");
      setAssignments(JSON.parse(localStorage.getItem("fixora_department_assignments") ?? "{}"));
    } catch {}

    try {
      const r = await fetch("/api/complaints", { cache: "no-store" });
      const d = await r.json();
      const server: Complaint[] = d.complaints ?? [];
      const merged = [...local, ...server].filter(
        (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
      );
      setComplaints(merged);
    } catch {
      setComplaints(local);
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
      if (statusFilter === "critical" && c.severity !== "critical") return false;
      if (statusFilter === "overdue" && !deadlineInfo(c).overdue) return false;
      if (!q) return true;
      return [c.title, c.description, c.street, c.category, c.citizenName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [departmentComplaints, query, statusFilter]);

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
      const res = await fetch(`/api/complaints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("server update failed");
    } catch {
      const current = complaints.find((c) => c.id === id);
      if (current) {
        const updated = {
          ...current,
          status: action === "start" ? "in_progress" : action === "resolve" ? "resolved" : current.status,
          updatedAt: new Date().toISOString(),
        } as Complaint;
        const next = complaints.map((c) => c.id === id ? updated : c);
        setComplaints(next);
        try {
          localStorage.setItem("fixora_local_complaints", JSON.stringify(next.slice(0, 50)));
        } catch {}
        if (selectedComplaint?.id === id) setSelectedComplaint(updated);
      }
      setBusy(null);
      return;
    }
    await load();
    const refreshed = complaints.find((c) => c.id === id);
    if (refreshed && selectedComplaint?.id === id) setSelectedComplaint(refreshed);
    setBusy(null);
  };

  const assign = (id: number) => {
    if (!assignedOfficer) return;
    const next = { ...assignments, [String(id)]: assignedOfficer };
    setAssignments(next);
    try {
      localStorage.setItem("fixora_department_assignments", JSON.stringify(next));
    } catch {}
  };

  const openDetails = (c: Complaint) => {
    setSelectedComplaint(c);
    setAssignedOfficer(assignments[String(c.id)] ?? "");
    setResolutionNote("");
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

      <div className="flex flex-wrap gap-2">
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
        {(["all", "critical", "overdue"] as const).map((k) => (
          <button key={k} onClick={() => setStatusFilter(k)} className={cn("rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-wide transition", statusFilter === k ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500")}>
            {k === "all" ? "All priority" : k === "critical" ? "Critical" : "Overdue"}
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
                      <button onClick={() => openDetails(c)} className="shrink-0 text-slate-300 hover:text-brand-500">
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
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
                      {assignments[String(c.id)] && (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[9.5px] font-black text-teal-700">
                          {assignments[String(c.id)]}
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

      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-600">Complaint Command View</p>
                <h2 className="mt-0.5 text-lg font-black text-slate-900">#FX-{selectedComplaint.id}</h2>
              </div>
              <button onClick={() => setSelectedComplaint(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-[150px_1fr]">
                <img src={selectedComplaint.photoUrl || "/images/complaints/pothole.jpg"} alt="" className="h-36 w-full rounded-2xl object-cover sm:h-32" />
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusPill status={selectedComplaint.status} />
                    <SeverityBadge severity={selectedComplaint.severity} />
                    {deadlineInfo(selectedComplaint).overdue && <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black text-rose-600">SLA OVERDUE</span>}
                  </div>
                  <h3 className="mt-2 text-base font-black text-slate-900">{selectedComplaint.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{selectedComplaint.description || "No description provided."}</p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-slate-500"><MapPin className="h-3.5 w-3.5 text-teal-600" />{selectedComplaint.street || "Location unavailable"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["Reported", timeAgo(selectedComplaint.reportedAt)],
                  ["Supporters", String(selectedComplaint.supporters ?? 1)],
                  ["SLA", deadlineInfo(selectedComplaint).overdue ? "Overdue" : `${deadlineInfo(selectedComplaint).days}d left`],
                  ["Escalation", String(selectedComplaint.escalationLevel ?? 0)],
                ].map(([k,v]) => (
                  <div key={k} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[9px] font-black uppercase tracking-wide text-slate-400">{k}</p>
                    <p className="mt-1 text-xs font-black text-slate-800">{v}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
                  <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-brand-600" /><p className="text-xs font-black text-slate-800">AI Triage</p></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white p-2"><p className="text-lg font-black text-brand-600">{selectedComplaint.severity === "critical" ? "92" : selectedComplaint.severity === "high" ? "78" : "54"}%</p><p className="text-[8px] font-bold uppercase text-slate-400">Risk</p></div>
                    <div className="rounded-xl bg-white p-2"><p className="text-lg font-black text-teal-600">{selectedComplaint.supporters ?? 1}</p><p className="text-[8px] font-bold uppercase text-slate-400">Reports</p></div>
                    <div className="rounded-xl bg-white p-2"><p className="text-lg font-black text-orange-500">{selectedComplaint.escalationLevel ?? 0}</p><p className="text-[8px] font-bold uppercase text-slate-400">Escalation</p></div>
                  </div>
                  <p className="mt-3 text-[10px] leading-4 text-slate-500">Priority is based on severity, SLA risk, supporter count and escalation level.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-teal-600" /><p className="text-xs font-black text-slate-800">Field Assignment</p></div>
                  <select value={assignedOfficer} onChange={(e) => setAssignedOfficer(e.target.value)} className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold outline-none focus:border-brand-400">
                    <option value="">Select officer / team</option>
                    <option>Roads Team A</option>
                    <option>Roads Team B</option>
                    <option>Water Response Team</option>
                    <option>Electrical Field Team</option>
                    <option>Sanitation Team</option>
                    <option>Public Safety Team</option>
                  </select>
                  <button onClick={() => assign(selectedComplaint.id)} disabled={!assignedOfficer} className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-black text-white disabled:opacity-40">Save Assignment</button>
                  {assignments[String(selectedComplaint.id)] && <p className="mt-2 text-[10px] font-bold text-teal-600">Assigned: {assignments[String(selectedComplaint.id)]}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs font-black text-slate-800">Action Timeline</p></div>
                <div className="mt-3 space-y-2 text-[10px]">
                  {[
                    ["Submitted", selectedComplaint.reportedAt, Clock3],
                    ["AI verification", selectedComplaint.updatedAt, BrainCircuit],
                    ["Department queue", selectedComplaint.updatedAt, Building2],
                    [selectedComplaint.status === "in_progress" || selectedComplaint.status === "resolved" ? "Work started" : "Awaiting field action", selectedComplaint.updatedAt, Wrench],
                    [selectedComplaint.status === "resolved" ? "Resolution submitted" : "Resolution pending", selectedComplaint.updatedAt, CheckCircle2],
                  ].map(([label, date, Icon], i) => {
                    const I = Icon as typeof Clock3;
                    return <div key={String(label)} className="flex items-center gap-2"><span className={cn("grid h-7 w-7 place-items-center rounded-full", i <= (selectedComplaint.status === "resolved" ? 4 : selectedComplaint.status === "in_progress" ? 3 : 2) ? "bg-teal-50 text-teal-600" : "bg-slate-100 text-slate-400")}><I className="h-3.5 w-3.5" /></span><span className="font-bold text-slate-700">{String(label)}</span><span className="ml-auto text-slate-400">{timeAgo(String(date))}</span></div>;
                  })}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button onClick={() => act(selectedComplaint.id, "start")} disabled={busy === selectedComplaint.id || selectedComplaint.status === "in_progress" || selectedComplaint.status === "resolved"} className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-black text-slate-700 disabled:opacity-40">Start Work</button>
                <button onClick={() => act(selectedComplaint.id, "resolve")} disabled={busy === selectedComplaint.id || selectedComplaint.status === "resolved"} className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 py-2.5 text-xs font-black text-white disabled:opacity-40">Mark Resolved</button>
                <Link href={`/complaints/${selectedComplaint.id}`} className="flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 py-2.5 text-xs font-black text-brand-700">Citizen Tracking</Link>
              </div>

              <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Resolution note / field update..." className="min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-brand-400" />
              <p className="text-[9px] text-slate-400">Assignment is saved locally for this prototype. Resolution actions use the live complaint API when available and fall back to local state.</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-slate-400">
        Department actions update citizen tracking. Resolved cases can carry proof photos and enter the citizen verification flow.
      </p>
    </div>
  );
}
