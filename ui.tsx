"use client";

import { motion } from "framer-motion";
import { MapPin, Check } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { SEVERITY_META, STATUS_META, statusLabelKey } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";

export function Logo({ size = 40, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {pulse && (
        <span className="absolute inset-0 rounded-2xl bg-brand-500/40 animate-pulse-ring" />
      )}
      <div
        className="relative grid place-items-center rounded-2xl text-white shadow-lg shadow-brand-600/30"
        style={{
          width: size,
          height: size,
          background: "linear-gradient(135deg, #1d64f0 0%, #0d9488 100%)",
        }}
      >
        <MapPin style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.4} />
        <span
          className="absolute -bottom-1 -right-1 grid place-items-center rounded-full bg-white"
          style={{ width: size * 0.42, height: size * 0.42 }}
        >
          <Check className="text-teal-600" style={{ width: size * 0.3, height: size * 0.3 }} strokeWidth={3.5} />
        </span>
      </div>
    </div>
  );
}

type BtnVariant = "primary" | "teal" | "outline" | "ghost" | "danger" | "dark";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  full?: boolean;
}

export function Btn({
  variant = "primary",
  full,
  className,
  children,
  ...rest
}: BtnProps) {
  const styles: Record<BtnVariant, string> = {
    primary:
      "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30 hover:shadow-brand-600/40",
    teal:
      "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-600/30 hover:shadow-teal-600/40",
    outline:
      "bg-white text-brand-700 border border-brand-200 hover:border-brand-400 hover:bg-brand-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    danger:
      "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100",
    dark: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20",
  };
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        full && "w-full",
        styles[variant],
        className
      )}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_-12px_rgba(20,78,221,0.12)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Chip({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <Chip className={cn("border", meta.chip)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.bar)} />
      {t(statusLabelKey[status] ?? "stSubmitted")}
    </Chip>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const { t } = useI18n();
  const meta =
    SEVERITY_META[severity as keyof typeof SEVERITY_META] ?? SEVERITY_META.Medium;
  const key =
    severity === "Critical"
      ? "sevCritical"
      : severity === "High"
      ? "sevHigh"
      : severity === "Low"
      ? "sevLow"
      : "sevMedium";
  return (
    <Chip className={cn("border", meta.bg, meta.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {t(key)}
    </Chip>
  );
}

export function SectionTitle({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl"
      >
        {children}
      </motion.div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  sub,
  action,
}: {
  icon: ReactNode;
  title: string;
  sub?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <p className="font-display font-bold text-slate-800">{title}</p>
      {sub && <p className="text-sm text-slate-500">{sub}</p>}
      {action}
    </Card>
  );
}
