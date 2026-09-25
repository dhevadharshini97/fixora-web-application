"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Radar,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
  ScanSearch,
} from "lucide-react";
import { Logo, Btn } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getProfile } from "@/lib/utils";

const words = ["Report.", "Track.", "Verify."];

export default function Splash() {
  const router = useRouter();
  const { t } = useI18n();
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    const p = getProfile();
    if (p?.fullName) setExisting(p.fullName);
  }, []);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-950">
      {/* ambient */}
      <div className="absolute inset-0 grid-bg opacity-40" style={{ backgroundSize: "52px 52px" }} />
      <div className="absolute -top-40 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-brand-600/30 blur-[130px]" />
      <div className="absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-teal-500/25 blur-[120px]" />

      {/* radar */}
      <div className="pointer-events-none absolute left-1/2 top-[13%] -translate-x-1/2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/25"
            style={{ width: 160 + i * 120, height: 160 + i * 120 }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.25, 0.55] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* floating badges */}
      {[
        { Icon: Camera, x: "-38vw", y: "8vh", d: 0.2 },
        { Icon: ScanSearch, x: "34vw", y: "4vh", d: 0.9 },
        { Icon: BadgeCheck, x: "30vw", y: "20vh", d: 0.5 },
        { Icon: ShieldCheck, x: "-34vw", y: "19vh", d: 1.2 },
      ].map(({ Icon, x, y, d }, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-[16%] hidden sm:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, -12, 0] }}
          transition={{ opacity: { delay: d + 0.8 }, y: { duration: 6, repeat: Infinity, delay: d } }}
          style={{ x, y }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-teal-200 backdrop-blur-md">
            <Icon className="h-5 w-5" />
          </div>
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-14 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 160 }}
        >
          <Logo size={92} pulse />
        </motion.div>

        <motion.h1
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-7 font-display text-6xl font-bold tracking-tight text-white sm:text-7xl"
        >
          FIXORA
        </motion.h1>

        <div className="mt-4 flex items-center gap-2.5">
          {words.map((w, i) => (
            <motion.span
              key={w}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.22 }}
              className={
                i === 2
                  ? "font-display text-xl font-bold text-teal-300 sm:text-2xl"
                  : "font-display text-xl font-bold text-white/85 sm:text-2xl"
              }
            >
              {w}
            </motion.span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.45 }}
          className="mt-5 max-w-sm text-sm leading-relaxed text-slate-300/90"
        >
          AI-powered civic intelligence. One photo is all it takes — FIXORA
          detects, routes, escalates and proves the fix.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.65 }}
          className="mt-9 flex w-full max-w-xs flex-col gap-3"
        >
          {existing ? (
            <Btn
              variant="teal"
              full
              onClick={() => router.push("/home")}
              className="py-4 text-base"
            >
              {t("continueAs")} {existing.split(" ")[0]}
              <ArrowRight className="h-5 w-5" />
            </Btn>
          ) : null}
          <Btn
            variant={existing ? "outline" : "primary"}
            full
            onClick={() => router.push("/language")}
            className={existing ? "border-white/20 bg-white/10 text-white hover:bg-white/15 py-4 text-base" : "py-4 text-base"}
          >
            {t("getStarted")}
            <ArrowRight className="h-5 w-5" />
          </Btn>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="relative z-10 pb-8 pt-6 text-center"
      >
        <div className="mx-auto flex max-w-xs items-center justify-center gap-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Radar className="h-3.5 w-3.5 text-teal-400" /> GPS Geotag
          </span>
          <span className="flex items-center gap-1.5">
            <ScanSearch className="h-3.5 w-3.5 text-teal-400" /> Problem DNA
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-400" /> Privacy AI
          </span>
        </div>
        <p className="mt-4 text-[10px] text-slate-500">
          Civic Intelligence Platform · v1.0 · Demo build
        </p>
      </motion.div>
    </div>
  );
}
