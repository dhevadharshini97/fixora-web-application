"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Clock3, MapPin, RefreshCw, ShieldCheck,
  Timer, Building2, AlertTriangle, RotateCcw,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { StatusPill, SeverityBadge, Btn } from "@/components/ui";
import { deadlineInfo, timeAgo } from "@/lib/utils";

const STEPS = [
  { key: "submitted", label: "Problem Submitted", icon: Clock3 },
  { key: "ai_verified", label: "AI Verification", icon: ShieldCheck },
  { key: "assigned", label: "Department Assigned", icon: Building2 },
  { key: "in_progress", label: "Work In Progress", icon: Timer },
  { key: "resolved", label: "Resolved", icon: CheckCircle2 },
  { key: "verified", label: "Citizen Verified", icon: ShieldCheck },
];
const rank: Record<string, number> = { submitted: 0, ai_verified: 1, assigned: 2, in_progress: 3, resolved: 4, verified: 5, reopened: 3 };
function statusRank(status: string) { return rank[status] ?? 0; }
function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ComplaintTrackingPage() {
  const params = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  async function load(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/complaints/${params.id}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setComplaint(data.complaint);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(timer);
  }, [params.id]);

  async function action(name: "verify" | "reopen") {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/complaints/${params.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: name, dna: complaint?.problemDna }),
      });
      const data = await res.json();
      if (res.ok) setComplaint(data.complaint);
    } finally { setActionLoading(false); }
  }

  const dl = complaint ? deadlineInfo(complaint) : null;
  const currentRank = complaint ? statusRank(complaint.status) : 0;
  const progress = useMemo(() => complaint ? STEPS.map((step, i) => ({
    ...step,
    done: complaint.status === "reopened" ? i < 3 : i <= currentRank,
    current: complaint.status !== "verified" && complaint.status !== "reopened" && i === currentRank,
  })) : [], [complaint, currentRank]);

  if (loading) return <div className="space-y-4"><div className="h-10 w-48 animate-pulse rounded-xl bg-white" /><div className="h-72 animate-pulse rounded-3xl bg-white" /></div>;

  if (!complaint) return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
      <h1 className="mt-3 text-xl font-bold text-slate-900">Problem not found</h1>
      <Link href="/complaints" className="mt-4 inline-block text-sm font-bold text-brand-600">Back to My Problems</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/complaints" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-600"><ArrowLeft className="h-4 w-4" /> My Problems</Link>
        <button onClick={() => load(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-200">FIXORA Tracking</p>
            <h1 className="mt-1 text-2xl font-bold">{complaint.title}</h1>
            <p className="mt-2 text-xs text-blue-100">Complaint ID: <span className="font-mono font-bold">FX-{String(complaint.id).padStart(5, "0")}</span></p>
          </div>
          <StatusPill status={complaint.status} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-[10px] text-blue-100">Department</p><p className="mt-1 text-sm font-bold">{complaint.department || "Assigning..."}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-[10px] text-blue-100">Severity</p><div className="mt-1"><SeverityBadge severity={complaint.severity} /></div></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-[10px] text-blue-100">Reported</p><p className="mt-1 text-sm font-bold">{timeAgo(complaint.reportedAt)}</p></div>
          <div className="rounded-2xl bg-white/10 p-3"><p className="text-[10px] text-blue-100">Supporters</p><p className="mt-1 text-sm font-bold">{complaint.supporters ?? 0}</p></div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold text-slate-900">Live Status Timeline</h2><p className="text-xs text-slate-500">Updates automatically every 30 seconds.</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black text-teal-700">LIVE</span></div>
        <div className="mt-6 space-y-0">
          {progress.map((step, i) => {
            const Icon = step.icon;
            return <div key={step.key} className="flex gap-3"><div className="flex w-8 flex-col items-center"><div className={`grid h-8 w-8 place-items-center rounded-full border-2 ${step.done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-200 bg-slate-50 text-slate-300"}`}><Icon className="h-4 w-4" /></div>{i < progress.length - 1 && <div className={`my-1 h-10 w-0.5 ${step.done && progress[i + 1].done ? "bg-brand-300" : "bg-slate-100"}`} />}</div><div className="pb-5 pt-1"><p className={`text-sm font-bold ${step.current ? "text-brand-700" : "text-slate-800"}`}>{step.label}{step.current ? " · Current" : ""}</p>{step.current && <p className="mt-0.5 text-[11px] text-slate-500">Your complaint is currently at this stage.</p>}</div></div>;
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-slate-800"><MapPin className="h-4 w-4 text-teal-600" /><h2 className="font-bold">Problem Location</h2></div><p className="mt-3 text-sm font-semibold text-slate-700">{complaint.street || "Location captured from report"}</p><p className="mt-1 text-xs text-slate-500">{complaint.city || "City not specified"}{complaint.latitude != null && complaint.longitude != null ? ` · ${complaint.latitude.toFixed(5)}, ${complaint.longitude.toFixed(5)}` : ""}</p></div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-slate-800"><Timer className="h-4 w-4 text-orange-500" /><h2 className="font-bold">Resolution Target</h2></div><p className={`mt-3 text-sm font-bold ${dl?.overdue ? "text-rose-600" : "text-slate-800"}`}>{complaint.deadline ? formatDate(complaint.deadline) : "Being calculated"}</p><p className="mt-1 text-xs text-slate-500">{dl?.overdue ? `${dl.days} day(s) overdue · escalation level ${complaint.escalationLevel ?? 0}` : `SLA: ${complaint.slaDays ?? 7} days`}</p></div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Problem Details</h2><p className="mt-2 text-sm leading-6 text-slate-600">{complaint.description || "No additional description provided."}</p>{complaint.problemDna && <p className="mt-3 font-mono text-[10px] text-slate-400">Problem DNA: {complaint.problemDna}</p>}<p className="mt-2 text-[11px] text-slate-400">Last updated: {formatDate(complaint.updatedAt)}</p></section>

      {complaint.photoUrl && <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-900">Submitted Evidence</h2><img src={complaint.photoUrl} alt={complaint.title} className="mt-3 max-h-80 w-full rounded-2xl object-cover" />{complaint.afterPhotoUrl && <div className="mt-4"><p className="text-sm font-bold text-slate-700">Resolution Proof</p><img src={complaint.afterPhotoUrl} alt="Resolution proof" className="mt-2 max-h-80 w-full rounded-2xl object-cover" /></div>}</section>}

      {complaint.status === "resolved" && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-bold text-emerald-900">Please verify the resolution</h2><p className="mt-1 text-xs text-emerald-700">If the problem is genuinely fixed, mark it verified. If it is still present, reopen it.</p><div className="mt-4 flex flex-wrap gap-2"><Btn variant="teal" disabled={actionLoading} onClick={() => action("verify")}><CheckCircle2 className="h-4 w-4" /> Verify Fixed</Btn><Btn variant="outline" disabled={actionLoading} onClick={() => action("reopen")}><RotateCcw className="h-4 w-4" /> Still a Problem</Btn></div></section>}

      {complaint.status === "reopened" && <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This problem was reopened and sent back for attention. Escalation level: {complaint.escalationLevel ?? 0}.</div>}
    </div>
  );
}
