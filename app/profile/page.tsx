"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building,
  Languages,
  ClipboardList,
  BadgeCheck,
  Users,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Btn, Card, Chip } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { getProfile, type LocalProfile } from "@/lib/utils";
import { LANGUAGES } from "@/lib/constants";

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [stats, setStats] = useState({ mine: 0, verified: 0, supported: 0 });

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    let myIds: number[] = [];
    try {
      myIds = JSON.parse(localStorage.getItem("fixora_my_complaints") ?? "[]");
    } catch {}
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => {
        const all: Complaint[] = d.complaints ?? [];
        setStats({
          mine: all.filter((c) => myIds.includes(c.id)).length,
          verified: all.filter((c) => c.status === "verified" && myIds.includes(c.id)).length,
          supported: all.reduce((a, c) => a + (c.supporters ?? 1), 0),
        });
      })
      .catch(() => {});
  }, []);

  const langMeta = LANGUAGES.find((l) => l.code === (profile?.language ?? lang)) ?? LANGUAGES[0];

  const logout = () => {
    try {
      localStorage.clear();
    } catch {}
    router.replace("/");
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{t("navProfile")}</h1>

      {/* identity card */}
      <Card className="relative overflow-hidden p-0">
        <div className="h-24 bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500">
          <div className="grid-bg h-full w-full opacity-25" />
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-12 flex items-end justify-between">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[26px] border-4 border-white bg-gradient-to-br from-brand-100 to-teal-100 text-3xl font-bold text-brand-600 shadow-xl">
              {profile?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photo} alt="profile" className="h-full w-full object-cover" />
              ) : (
                (profile?.fullName ?? "C").charAt(0).toUpperCase()
              )}
            </div>
            <Btn variant="outline" className="px-4 py-2 text-xs" onClick={() => router.push("/create-profile")}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Btn>
          </div>
          <h2 className="mt-3 font-display text-xl font-bold text-slate-900">
            {profile?.fullName ?? "Citizen"}
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            {profile?.city ?? "Chennai"} · {profile?.age ?? "—"} yrs · Citizen ID FXR-CIT-2026
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Chip className="border-teal-200 bg-teal-50 text-teal-700">
              <ShieldCheck className="h-3 w-3" /> Privacy AI ON
            </Chip>
            <Chip className="border-brand-200 bg-brand-50 text-brand-700">
              <Languages className="h-3 w-3" /> {langMeta.native}
            </Chip>
          </div>
        </div>
      </Card>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: ClipboardList, v: stats.mine, l: t("reports"), cls: "from-brand-600 to-brand-500" },
          { icon: BadgeCheck, v: stats.verified, l: t("stResolved"), cls: "from-teal-600 to-teal-500" },
          { icon: Users, v: stats.supported, l: t("citizensAffected").split(" ")[0], cls: "from-violet-600 to-violet-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="p-3.5 text-center">
              <div className={`mx-auto mb-2 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${s.cls} text-white`}>
                <s.icon className="h-4 w-4" />
              </div>
              <p className="font-display text-xl font-bold text-slate-900">{s.v}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{s.l}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* details */}
      <Card className="divide-y divide-slate-100 p-1.5">
        {[
          { icon: Phone, k: t("phone"), v: profile?.phone },
          { icon: Mail, k: t("email"), v: profile?.email },
          { icon: MapPin, k: t("address"), v: profile?.address },
          { icon: Building, k: t("city"), v: profile?.city },
          { icon: Languages, k: t("preferredLanguage"), v: langMeta.native },
        ].map((row) => (
          <div key={row.k} className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
              <row.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{row.k}</p>
              <p className="truncate text-[13.5px] font-bold text-slate-800">{row.v || "—"}</p>
            </div>
          </div>
        ))}
      </Card>

      <Btn variant="danger" full onClick={logout} className="py-3.5">
        <LogOut className="h-4.5 w-4.5" /> {t("navLogout")}
      </Btn>
    </div>
  );
}
