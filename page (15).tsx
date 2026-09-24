"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n";
import { Logo, Btn } from "@/components/ui";
import { getProfile } from "@/lib/utils";

export default function LanguagePage() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [selected, setSelected] = useState(lang);

  const proceed = () => {
    setLang(selected);
    const p = getProfile();
    router.push(p ? "/home" : "/role");
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-8 pt-6">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Logo size={34} />
        <p className="font-display text-lg font-bold">FIXORA</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10 text-center"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-teal-500 text-white shadow-lg shadow-brand-600/30">
          <Languages className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          {t("selectLanguage")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("languageSub")}</p>
      </motion.div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        {LANGUAGES.map((l, i) => {
          const active = selected === l.code;
          return (
            <motion.button
              key={l.code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSelected(l.code);
                setLang(l.code);
              }}
              className={`relative flex flex-col items-center gap-1 rounded-3xl border-2 px-2 py-5 transition ${
                active
                  ? "border-brand-500 bg-white shadow-xl shadow-brand-600/20"
                  : "border-slate-200 bg-white/70 hover:border-brand-200"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="lang-check"
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                </motion.span>
              )}
              <span className="font-display text-lg font-bold leading-tight text-slate-900">
                {l.native}
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
                {l.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-auto pt-10">
        <Btn full onClick={proceed} className="py-4 text-base">
          {t("continue")}
          <ArrowRight className="h-5 w-5" />
        </Btn>
      </div>
    </div>
  );
}
