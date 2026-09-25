"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  EyeOff,
  CarFront,
  UserRound,
  Database,
  Lock,
  ScanFace,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const BOXES = [
  { icon: UserRound, label: "Face #1", top: "8%", left: "9%", w: "17%", h: "26%" },
  { icon: UserRound, label: "Face #2", top: "12%", left: "42%", w: "16%", h: "24%" },
  { icon: CarFront, label: "Plate KA-09", top: "64%", left: "40%", w: "30%", h: "11%" },
];

export default function PrivacyPage() {
  const { t } = useI18n();
  const [on, setOn] = useState(true);
  const [scanning, setScanning] = useState(false);

  const rerun = () => {
    setScanning(true);
    setOn(false);
    setTimeout(() => setOn(true), 900);
    setTimeout(() => setScanning(false), 2300);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {t("privacyTitle")}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">{t("privacyDesc")}</p>
      </div>

      {/* interactive demo */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/privacy-demo.jpg" alt="street" className="h-64 w-full object-cover sm:h-72" />
          {scanning && (
            <span className="animate-scanline absolute left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_20px_#5eead4]" />
          )}
          {BOXES.map((b, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 1.15 }}
              transition={{ delay: scanning ? 0.5 + i * 0.4 : 0 }}
              className="absolute rounded-lg border-2 border-teal-300"
              style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
            >
              <span className="absolute inset-0 rounded-md backdrop-blur-xl" />
              <span className="absolute -top-6 left-0 flex items-center gap-1 whitespace-nowrap rounded-full bg-teal-500 px-2 py-0.5 text-[9px] font-bold text-white">
                <b.icon className="h-2.5 w-2.5" />
                {b.label} blurred
              </span>
            </motion.div>
          ))}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-300 backdrop-blur">
            <ScanFace className="h-3.5 w-3.5" />
            {scanning ? "Privacy AI scanning…" : "Live demo · simulation"}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-bold text-slate-900">Auto-anonymization</p>
            <p className="text-[11px] font-medium text-slate-400">
              {on ? "2 faces · 1 number plate protected in this frame" : "Protection disabled — raw frame visible"}
            </p>
          </div>
          <button
            onClick={rerun}
            className={cn(
              "relative h-8 w-15 rounded-full p-1 transition",
              on ? "bg-gradient-to-r from-teal-500 to-brand-500" : "bg-slate-200"
            )}
            style={{ width: 60 }}
            aria-label="Toggle privacy AI"
          >
            <motion.span
              animate={{ x: on ? 27 : 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="grid h-6 w-6 place-items-center rounded-full bg-white shadow"
            >
              {on ? <Check className="h-3.5 w-3.5 text-teal-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
            </motion.span>
          </button>
        </div>
      </Card>

      {/* principles */}
      <div className="grid gap-3">
        {[
          {
            icon: ScanFace,
            title: "Faces & plates auto-blurred",
            desc: "Before any photo leaves your phone, FIXORA Privacy AI detects faces and vehicle number plates and blurs them on-device.",
            grad: "from-brand-600 to-brand-500",
          },
          {
            icon: Database,
            title: "Data minimization",
            desc: "Only the problem, its GPS point and category are sent. No contact lists, no background tracking, no ads — ever.",
            grad: "from-teal-600 to-teal-500",
          },
          {
            icon: Lock,
            title: "Citizen-controlled identity",
            desc: "Departments see reports, not identities. Your profile stays on your device and is shared only when you choose.",
            grad: "from-violet-600 to-violet-500",
          },
          {
            icon: ShieldCheck,
            title: "EXIF & metadata stripped",
            desc: "Hidden camera metadata (device ID, exact second, lens info) is removed so a photo proves a problem — not a person.",
            grad: "from-slate-700 to-slate-600",
          },
        ].map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="flex items-start gap-4 p-4">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${f.grad} text-white shadow-lg`}>
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">{f.title}</p>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-5 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-teal-600" />
        <p className="mt-2 font-display text-base font-bold text-teal-900">
          Report boldly. Stay anonymous.
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[12px] font-medium leading-relaxed text-teal-700/80">
          Citizens should never fear reporting broken governance. FIXORA's Privacy AI makes every report
          safe by default — that is why civic participation scales.
        </p>
      </Card>
    </div>
  );
}
