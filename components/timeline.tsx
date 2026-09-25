"use client";

import { motion } from "framer-motion";
import { Check, RotateCcw } from "lucide-react";
import { STATUS_LADDER, statusLabelKey } from "@/lib/constants";
import { statusIndex, formatDate, cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Complaint } from "@/db/schema";

export default function Timeline({ complaint }: { complaint: Complaint }) {
  const { t } = useI18n();
  const c = complaint;
  const reopened = c.status === "reopened";
  const currentIdx = reopened ? 3 : statusIndex(c.status);

  const stamp = (idx: number): string => {
    if (!c.reportedAt) return "";
    const base = new Date(c.reportedAt).getTime();
    const offsets = [0, 12 * 60000, 2 * 3600000, 26 * 3600000, 0, 0];
    if (idx === 4) return c.resolvedAt ? formatDate(c.resolvedAt) : "";
    if (idx === 5) return c.verifiedAt ? formatDate(c.verifiedAt) : "";
    if (idx <= currentIdx) return formatDate(new Date(base + offsets[idx]).toISOString());
    return "";
  };

  return (
    <div className="relative">
      {STATUS_LADDER.map((s, idx) => {
        const done = idx < currentIdx;
        const current = idx === currentIdx && !reopened;
        const activeNow = idx === currentIdx && reopened && idx === 3;
        return (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {idx < STATUS_LADDER.length - 1 && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-24px)] w-0.5 rounded-full",
                  idx < currentIdx
                    ? "bg-gradient-to-b from-teal-500 to-brand-500"
                    : "bg-slate-200"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2",
                done || (activeNow && reopened)
                  ? "border-teal-500 bg-teal-500 text-white"
                  : current
                  ? "border-brand-500 bg-white text-brand-600"
                  : "border-slate-200 bg-white text-slate-300"
              )}
            >
              {current && !done && (
                <span className="absolute inset-0 rounded-full bg-brand-400/50 animate-pulse-ring" />
              )}
              {done || (reopened && idx <= 4) ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                <span className="h-2 w-2 rounded-full bg-current" />
              )}
            </div>
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-bold",
                  done || current || (reopened && idx <= 4)
                    ? "text-slate-900"
                    : "text-slate-400"
                )}
              >
                {t(statusLabelKey[s])}
              </p>
              {stamp(idx) && (
                <p className="text-[11px] font-medium text-slate-400">{stamp(idx)}</p>
              )}
            </div>
          </motion.div>
        );
      })}
      {reopened && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-4"
        >
          <div className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-rose-500 bg-rose-500 text-white">
            <span className="absolute inset-0 rounded-full bg-rose-400/50 animate-pulse-ring" />
            <RotateCcw className="h-4 w-4" strokeWidth={3} />
          </div>
          <div className="pt-1">
            <p className="text-sm font-bold text-rose-600">{t("stReopened")}</p>
            <p className="text-[11px] font-medium text-slate-400">
              {formatDate(c.updatedAt)}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
