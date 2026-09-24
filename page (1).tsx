"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Users,
  Copy,
  Check,
  Fingerprint,
  Building2,
  Timer,
  ArrowUpCircle,
  CalendarCheck,
  ShieldCheck,
  Repeat,
  BadgeCheck,
  Undo2,
  ThumbsUp,
  ThumbsDown,
  BrainCircuit,
  X,
  Handshake,
  CircleAlert,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Btn, Card, Sheet, StatusPill, SeverityBadge } from "@/components/ui";
import Timeline from "@/components/timeline";
import BeforeAfter from "@/components/before-after";
import MapPreview from "@/components/map-preview";
import { useI18n } from "@/lib/i18n";
import { deadlineInfo, formatDate, cn } from "@/lib/utils";
import { ESCALATION_LEVELS, SLA_BY_SEVERITY, type Severity } from "@/lib/constants";

export default function ComplaintDetail() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [c, setC] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reopenSheet, setReopenSheet] = useState(false);
  const [reason, setReason] = useState("");

  const load = () => {
    fetch(`/api/complaints/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.complaint) setC(d.complaint);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(load, [params.id]);

  const act = async (action: string, extra?: Record<string, unknown>) => {
    if (!c) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/complaints/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await r.json();
      if (d.complaint) setC(d.complaint);
    } catch {}
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-[26px] bg-white" />
        <div className="h-44 animate-pulse rounded-[26px] bg-white" />
      </div>
    );
  }

  if (!c) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-lg font-bold text-slate-700">Report not found</p>
        <Btn variant="outline" className="mt-4" onClick={() => router.push("/home")}>
          {t("backHome")}
        </Btn>
      </div>
    );
  }

  const dl = deadlineInfo(c);
  const open = c.status !== "resolved" && c.status !== "verified";
  const recurring = (c.reopenCount ?? 0) > 0 || !!c.recurringOfDna;
  const sla = SLA_BY_SEVERITY[(c.severity as Severity) ?? "Medium"];
  const verifiedDate = c.verifiedAt ? new Date(c.verifiedAt) : null;
  const rechecks = verifiedDate
    ? [
        { key: "recheck7" as const, date: new Date(verifiedDate.getTime() + 7 * 86400000) },
        { key: "recheck30" as const, date: new Date(verifiedDate.getTime() + 30 * 86400000) },
      ]
    : c.status === "resolved"
    ? [
        { key: "recheck7" as const, date: new Date(Date.now() + 7 * 86400000) },
        { key: "recheck30" as const, date: new Date(Date.now() + 30 * 86400000) },
      ]
    : [];

  return (
    <div className="space-y-5 pb-4">
      {/* header image */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.photoUrl || "/images/complaints/pothole.jpg"} alt={c.title} className="h-56 w-full object-cover sm:h-64" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3.5">
            <button
              onClick={() => router.back()}
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/90 text-slate-700 shadow backdrop-blur"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(c.problemDna ?? "").catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-950/70 px-3 py-2 font-mono text-[10.5px] font-bold text-teal-300 backdrop-blur"
            >
              <Fingerprint className="h-3.5 w-3.5" />
              {c.problemDna}
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent px-4 pb-4 pt-14">
            <div className="flex flex-wrap gap-1.5 pb-2">
              <StatusPill status={c.status} />
              <SeverityBadge severity={c.severity} />
            </div>
            <h1 className="font-display text-lg font-bold leading-snug text-white sm:text-xl">
              {c.title}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-teal-400" />
              {c.street} · {c.city}
              <span className="text-slate-500">·</span>
              {formatDate(c.reportedAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* recurring banner */}
      {recurring && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[26px] border-2 border-rose-300 bg-gradient-to-br from-rose-50 to-orange-50 p-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-lg shadow-rose-500/30">
              <Repeat className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-rose-800">{t("recurringDetected")}</h3>
              <p className="text-[11px] font-semibold text-rose-500">
                {t("problemDna")} lineage connected
              </p>
            </div>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 p-3">
            <span className="font-mono text-[11px] font-bold text-slate-500 line-through decoration-rose-400">
              {c.recurringOfDna ?? "FXR-····-PREV"}
            </span>
            <span className="text-rose-400">→</span>
            <span className="font-mono text-[11px] font-bold text-slate-800">{c.problemDna}</span>
          </div>
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-rose-600">
            Same Problem DNA signature detected again after a previous resolution. Root-Cause AI flagged
            the earlier fix as surface-level — the issue has been re-escalated to the {ESCALATION_LEVELS[Math.min(3, c.escalationLevel ?? 1)]}.
          </p>
        </motion.div>
      )}

      {/* smart info strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3">
          <Building2 className="h-4 w-4 text-brand-500" />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{t("department")}</p>
          <p className="mt-0.5 text-[11px] font-bold leading-tight text-slate-800">{c.department}</p>
        </Card>
        <Card className="p-3">
          <Timer className="h-4 w-4 text-teal-600" />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{t("resolutionDeadline")}</p>
          {open ? (
            <p className={cn("mt-0.5 text-[11px] font-bold", dl.overdue ? "text-rose-600" : "text-slate-800")}>
              {dl.overdue ? `${dl.days}d ${t("overdue")}` : `${dl.days} ${t("daysLeft")}`}
              <span className="block text-[9.5px] font-medium text-slate-400">SLA {sla}d</span>
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] font-bold text-emerald-600">
              Done
              <span className="block text-[9.5px] font-medium text-slate-400">{formatDate(c.resolvedAt)}</span>
            </p>
          )}
        </Card>
        <Card className="p-3">
          <ArrowUpCircle className="h-4 w-4 text-orange-500" />
          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">{t("escalated")}</p>
          <p className="mt-0.5 text-[11px] font-bold text-slate-800">
            {c.escalationLevel ? ESCALATION_LEVELS[Math.min(3, c.escalationLevel)] : ESCALATION_LEVELS[0]}
          </p>
          <p className="text-[9.5px] font-medium text-slate-400">
            {(c.supporters ?? 1)} {t("citizensAffected").split(" ")[0]}
          </p>
        </Card>
      </div>

      {/* community support row */}
      {open && (
        <Card className="flex items-center justify-between gap-3 p-3.5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                {(c.supporters ?? 1)} {t("citizensAffected")}
              </p>
              <p className="text-[11px] text-slate-400">More supporters = higher queue priority</p>
            </div>
          </div>
          <Btn variant="outline" disabled={busy} onClick={() => act("support")} className="px-4 py-2.5 text-xs">
            <Handshake className="h-4 w-4" /> {t("support")}
          </Btn>
        </Card>
      )}

      {/* before/after proof */}
      {(c.status === "resolved" || c.status === "verified") && c.afterPhotoUrl && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BadgeCheck className="h-4.5 w-4.5 text-teal-600" />
            <h2 className="font-display text-base font-bold text-slate-900">{t("beforeAfter")}</h2>
            <span className="ml-auto rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-teal-600">
              Geo-verified
            </span>
          </div>
          <BeforeAfter before={c.photoUrl || "/images/complaints/pothole.jpg"} after={c.afterPhotoUrl} />
        </Card>
      )}

      {/* citizen verification */}
      {c.status === "resolved" && (
        <Card className="border-2 border-teal-200 p-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-600/30">
              <ShieldCheck className="h-5.5 w-5.5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">{t("isItFixed")}</h2>
              <p className="text-[11.5px] font-medium text-slate-500">
                Citizen verification closes the loop — or reopens the case.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Btn variant="teal" disabled={busy} onClick={() => act("verify")}>
              <ThumbsUp className="h-4.5 w-4.5" /> {t("yesFixed")}
            </Btn>
            <Btn variant="danger" disabled={busy} onClick={() => setReopenSheet(true)}>
              <ThumbsDown className="h-4.5 w-4.5" /> {t("stillNotFixed")}
            </Btn>
          </div>
        </Card>
      )}

      {/* verified + rechecks */}
      {c.status === "verified" && (
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/60 p-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
              <BadgeCheck className="h-5.5 w-5.5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-emerald-900">{t("stVerification")} ✓</h2>
              <p className="text-[11.5px] font-medium text-emerald-600">
                Citizen confirmed the fix on {formatDate(c.verifiedAt)}. Case closed-loop verified.
              </p>
            </div>
          </div>
        </Card>
      )}

      {rechecks.length > 0 && (
        <div className="grid grid-cols-2 gap-2.5">
          {rechecks.map((r) => {
            const past = r.date.getTime() < Date.now();
            return (
              <Card key={r.key} className="flex items-center gap-3 p-3.5">
                <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", past ? "bg-emerald-100 text-emerald-600" : "bg-brand-50 text-brand-600")}>
                  <CalendarCheck className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-slate-800">{t(r.key)}</p>
                  <p className="text-[10px] font-medium text-slate-400">
                    {past ? "Completed" : formatDate(r.date.toISOString())}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* tracking */}
      <Card className="p-5">
        <h2 className="mb-5 font-display text-base font-bold text-slate-900">{t("trackComplaint")}</h2>
        <Timeline complaint={c} />
      </Card>

      {/* root cause + map */}
      <Card className="space-y-3 p-4">
        <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">
            <BrainCircuit className="h-3.5 w-3.5" /> {t("rootCause")}
          </p>
          <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-slate-700">{c.rootCause}</p>
        </div>
        {c.latitude != null && c.longitude != null && (
          <MapPreview lat={c.latitude} lon={c.longitude} height={170} />
        )}
        {c.description && (
          <p className="rounded-2xl bg-slate-50 p-3.5 text-[12.5px] font-medium leading-relaxed text-slate-600">
            “{c.description}”
          </p>
        )}
      </Card>

      {/* reopen sheet */}
      <Sheet open={reopenSheet} onClose={() => setReopenSheet(false)}>
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
            <Undo2 className="h-5 w-5 text-rose-500" /> {t("stillNotFixed")}
          </h3>
          <button onClick={() => setReopenSheet(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <p className="text-[12px] font-medium leading-relaxed text-rose-600">
            Reopening links this report to its Problem DNA history. If the same fault repeats, FIXORA flags it
            as a recurring pattern and escalates to the next authority level automatically.
          </p>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Tell us what's still wrong (optional)…"
          className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-sm font-medium outline-none focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
        />
        <Btn
          full
          variant="danger"
          disabled={busy}
          className="mt-4 py-3.5 border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
          onClick={() => {
            act("reopen", { dna: c.problemDna });
            setReopenSheet(false);
          }}
        >
          <Repeat className="h-4.5 w-4.5" /> Reopen Complaint
        </Btn>
      </Sheet>
    </div>
  );
}
