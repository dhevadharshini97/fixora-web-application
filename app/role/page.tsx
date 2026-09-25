"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, Building2, Languages } from "lucide-react";
import { Logo } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/constants";

export default function RolePage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const langMeta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const chooseCitizen = () => {
    try {
      localStorage.setItem("fixora_role", "citizen");
    } catch {}
    router.push("/create-profile");
  };

  const chooseDepartment = () => {
    try {
      localStorage.setItem("fixora_role", "department");
    } catch {}
    router.push("/department");
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
        <button
          onClick={() => router.push("/language")}
          className="ml-auto flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm"
        >
          <Languages className="h-3.5 w-3.5 text-teal-600" />
          {langMeta.native}
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 text-center"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          {t("chooseRole")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("roleSub")}</p>
      </motion.div>

      <div className="mt-10 flex flex-1 flex-col gap-4">
        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={chooseCitizen}
          className="group relative overflow-hidden rounded-3xl border-2 border-brand-500 bg-white p-6 text-left shadow-xl shadow-brand-600/15"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-50 transition group-hover:scale-150" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30">
              <User className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-bold text-slate-900">
                {t("citizen")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {t("citizenDesc")}
              </p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full bg-brand-600 text-white transition group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileTap={{ scale: 0.98 }}
          onClick={chooseDepartment}
          className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-6 text-left transition hover:border-teal-400"
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-50 transition group-hover:scale-150" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-600/30">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <p className="font-display text-xl font-bold text-slate-900">
                {t("department")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {t("departmentDesc")}
              </p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center self-center rounded-full bg-slate-100 text-slate-500 transition group-hover:translate-x-1 group-hover:bg-teal-600 group-hover:text-white">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 text-center text-xs text-slate-400"
        >
          {t("tagline")}
        </motion.p>
      </div>
    </div>
  );
}
