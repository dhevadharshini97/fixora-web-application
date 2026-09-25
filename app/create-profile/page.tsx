"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo, Btn } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/constants";
import { resizeImage, getProfile, type LocalProfile } from "@/lib/utils";

const inputCls =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100";

export default function CreateProfile() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const existing = typeof window !== "undefined" ? getProfile() : null;

  const [photo, setPhoto] = useState<string | null>(existing?.photo ?? null);
  const [form, setForm] = useState({
    fullName: existing?.fullName ?? "",
    age: existing?.age ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    address: existing?.address ?? "",
    city: existing?.city ?? "Chennai",
    language: existing?.language ?? lang,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const pickPhoto = async (f: File | undefined) => {
    if (!f) return;
    try {
      const data = await resizeImage(f, 420, 0.8);
      setPhoto(data);
    } catch {}
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().length < 3) e.fullName = "Enter your full name";
    const age = Number(form.age);
    if (!form.age || age < 10 || age > 110) e.age = "10–110";
    if (!/^\d{10}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Valid email";
    if (form.address.trim().length < 4) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    const profile: LocalProfile = { ...form, photo };
    try {
      localStorage.setItem("fixora_profile", JSON.stringify(profile));
      localStorage.setItem("fixora_role", "citizen");
      localStorage.setItem("fixora_lang", form.language);
      const small = photo ? await resizeImage(photo, 200, 0.7) : null;
      fetch("/api/citizens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl: small }),
      }).catch(() => {});
    } catch {}
    setTimeout(() => router.replace("/home"), 500);
  };

  const field = (
    key: string,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={form[key as keyof typeof form]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} ${errors[key] ? "border-rose-400 ring-4 ring-rose-100" : ""}`}
      />
      {errors[key] && (
        <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors[key]}</p>
      )}
    </motion.div>
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-10 pt-6">
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

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
          {t("createProfile")}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">{t("profileSub")}</p>
      </motion.div>

      {/* Photo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mt-7 flex flex-col items-center"
      >
        <button
          onClick={() => fileRef.current?.click()}
          className="relative grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-brand-100 to-teal-100 shadow-xl shadow-brand-600/15"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="profile" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-8 w-8 text-brand-500" />
          )}
          <span className="absolute bottom-0 inset-x-0 bg-slate-950/60 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
            {t("addPhoto")}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
      </motion.div>

      <div className="mt-8 flex flex-col gap-4">
        {field("fullName", t("fullName"), "Meera Krishnan")}
        <div className="grid grid-cols-2 gap-4">
          {field("age", t("age"), "32", "number")}
          {field("phone", t("phone"), "98110 22334", "tel")}
        </div>
        {field("email", t("email"), "you@example.com", "email")}
        {field("address", t("address"), "Flat 4B, Green Apts, 2nd Main Rd")}
        {field("city", t("city"), "Chennai")}

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            {t("preferredLanguage")}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => set("language", l.code)}
                className={`rounded-2xl border-2 px-2 py-2.5 text-xs font-bold transition ${
                  form.language === l.code
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-brand-200"
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <Btn full onClick={save} disabled={saving} className="py-4 text-base">
          {saving ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <>
              {t("saveContinue")}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Btn>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
          Your data stays on your device · Privacy AI enabled
        </p>
      </div>
    </div>
  );
}
