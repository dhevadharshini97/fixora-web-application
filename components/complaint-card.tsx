"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Users, ChevronRight, Clock, Fingerprint } from "lucide-react";
import type { Complaint } from "@/db/schema";
import { StatusPill, SeverityBadge } from "./ui";
import { deadlineInfo, timeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export default function ComplaintCard({
  complaint,
  index = 0,
  compact = false,
}: {
  complaint: Complaint;
  index?: number;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const c = complaint;
  const dl = deadlineInfo(c);
  const open = c.status !== "resolved" && c.status !== "verified";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
    >
      <Link href={`/complaints/${c.id}`} className="group block">
        <div className="flex gap-3 rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_-14px_rgba(20,78,221,0.15)] transition group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_40px_-14px_rgba(20,78,221,0.25)]">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.photoUrl || "/images/complaints/pothole.jpg"}
              alt={c.title}
              className="h-full w-full object-cover"
            />
            {open && dl.overdue && (
              <span className="absolute inset-x-0 bottom-0 bg-rose-600/90 py-0.5 text-center text-[8.5px] font-bold uppercase tracking-wide text-white">
                {dl.days}d {t("overdue")}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-[13.5px] font-bold leading-snug text-slate-900">
                {c.title}
              </h3>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
              <MapPin className="h-3 w-3 text-teal-600" />
              <span className="truncate">{c.street}</span>
              <span className="text-slate-300">·</span>
              <Clock className="h-3 w-3" />
              {timeAgo(c.reportedAt)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusPill status={c.status} />
              <SeverityBadge severity={c.severity} />
              {!compact && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500 border border-slate-200">
                  <Users className="h-3 w-3" /> {c.supporters}
                </span>
              )}
            </div>
            {!compact && c.problemDna && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                <Fingerprint className="h-3 w-3 text-brand-400" />
                {c.problemDna}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
