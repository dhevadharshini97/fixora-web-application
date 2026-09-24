"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TriangleAlert, ArrowUpCircle, Flame } from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card } from "@/components/ui";
import ComplaintCard from "@/components/complaint-card";
import { useI18n } from "@/lib/i18n";
import { cn, deadlineInfo, isOpen } from "@/lib/utils";
import { CATEGORIES, ESCALATION_LEVELS } from "@/lib/constants";

const FILTERS = [{ id: "all", label: "All" }, ...CATEGORIES.slice(0, 6).map((c) => ({ id: c.label, label: c.label.split(" ")[0] }))];

export default function UnresolvedPage() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => {
        setComplaints((d.complaints ?? []).filter(isOpen));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sorted = useMemo(() => {
    const list = filter === "all" ? complaints : complaints.filter((c) => c.category === filter);
    return [...list].sort((a, b) => {
      const da = deadlineInfo(a);
      const db = deadlineInfo(b);
      const scoreA = (da.overdue ? 1000 + da.days : -da.days) + (a.supporters ?? 0) * 0.1;
      const scoreB = (db.overdue ? 1000 + db.days : -db.days) + (b.supporters ?? 0) * 0.1;
      return scoreB - scoreA;
    });
  }, [complaints, filter]);

  const overdueCount = complaints.filter((c) => deadlineInfo(c).overdue).length;
  const escalatedCount = complaints.filter((c) => (c.escalationLevel ?? 0) > 0).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {t("navUnresolved")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{t("unresolvedDesc")}</p>
      </div>

      {/* escalation banner */}
      <Card className="relative overflow-hidden border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5">
        <Flame className="absolute -right-5 -top-5 h-28 w-28 text-rose-200/50" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-3.5 text-white shadow-lg shadow-rose-500/30">
            <TriangleAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold leading-none text-rose-700">
              {loading ? "–" : overdueCount}
            </p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-rose-500">
              {t("overdue")} · auto-escalated
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-display text-2xl font-bold leading-none text-orange-600">
              {loading ? "–" : escalatedCount}
            </p>
            <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-bold uppercase tracking-wide text-orange-500">
              <ArrowUpCircle className="h-3 w-3" /> {t("escalated")}
            </p>
          </div>
        </div>
        <p className="relative mt-3 text-[11.5px] font-medium leading-relaxed text-rose-600/80">
          When a smart deadline is missed, FIXORA automatically bumps the case up the chain:
          Field Officer → Ward Supervisor → Zonal Engineer → Commissioner.
        </p>
      </Card>

      {/* filters */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition",
              filter === f.id
                ? "border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/25"
                : "border-slate-200 bg-white text-slate-500 hover:border-rose-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((c, i) => (
            <div key={c.id} className="relative">
              {(c.escalationLevel ?? 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-1.5 flex items-center gap-1.5 pl-1 text-[10.5px] font-bold uppercase tracking-wide text-rose-500"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                  {t("escalated")} · {ESCALATION_LEVELS[Math.min(3, c.escalationLevel ?? 0)]}
                </motion.div>
              )}
              <ComplaintCard complaint={c} index={i} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
