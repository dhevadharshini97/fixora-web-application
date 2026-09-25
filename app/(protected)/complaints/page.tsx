"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, ClipboardList } from "lucide-react";
import type { Complaint } from "@/db/schema";
import ComplaintCard from "@/components/complaint-card";
import { Btn, EmptyState } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { cn, isOpen } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "resolved", label: "Resolved / Verified" },
];

export default function MyComplaintsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState("all");
  const [mine, setMine] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let localComplaints: Complaint[] = [];
    try {
      setMine(JSON.parse(localStorage.getItem("fixora_my_complaints") ?? "[]"));
      localComplaints = JSON.parse(localStorage.getItem("fixora_local_complaints") ?? "[]");
    } catch {}

    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => {
        const serverComplaints = d.complaints ?? [];
        const merged = [...localComplaints, ...serverComplaints].filter(
          (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
        );
        setComplaints(merged);
        setLoading(false);
      })
      .catch(() => {
        setComplaints(localComplaints);
        setLoading(false);
      });
  }, []);

  const myComplaints = useMemo(() => {
    if (!mine.length) return [];
    const map = new Map(complaints.map((c) => [c.id, c]));
    return mine.map((id) => map.get(id)).filter(Boolean) as Complaint[];
  }, [complaints, mine]);

  const list = useMemo(() => {
    const base = myComplaints;
    if (filter === "active") return base.filter(isOpen);
    if (filter === "resolved") return base.filter((c) => !isOpen(c));
    return base;
  }, [myComplaints, filter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            {t("navComplaints")}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {myComplaints.length} {t("reports").toLowerCase()}
          </p>
        </div>
        <Btn variant="primary" onClick={() => router.push("/report")} className="px-4 py-2.5">
          <Camera className="h-4 w-4" />
          {t("navReport")}
        </Btn>
      </div>

      {myComplaints.length > 0 && (
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-bold transition",
                filter === f.id
                  ? "border-brand-600 bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "border-slate-200 bg-white text-slate-500 hover:border-brand-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-6 w-6" />}
          title={t("myComplaintsEmpty")}
          sub="Problems you report will appear here with live tracking."
          action={
            <Btn variant="teal" onClick={() => router.push("/report")}>
              <Camera className="h-4.5 w-4.5" />
              {t("reportNow")}
            </Btn>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((c, i) => (
            <ComplaintCard key={c.id} complaint={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
