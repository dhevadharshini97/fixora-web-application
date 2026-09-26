"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrafficCone, Waves, Trash2, Lightbulb, Droplets, Sparkles, TrendingUp, Camera, TriangleAlert, HeartPulse, Info, MapPin, LocateFixed } from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Card, Btn, SeverityBadge } from "@/components/ui";
import ScoreGauge from "@/components/score-gauge";
import { useI18n } from "@/lib/i18n";
import computeStreetHealth from "@/lib/street";
import { cn, deadlineInfo, isOpen, timeAgo } from "@/lib/utils";

const METRIC_ICONS: Record<string, typeof TrafficCone> = { roads: TrafficCone, drainage: Waves, garbage: Trash2, streetlights: Lightbulb, water: Droplets, cleanliness: Sparkles };
const METRIC_BAR: Record<string, string> = { roads: "from-brand-600 to-brand-400", drainage: "from-cyan-600 to-cyan-400", garbage: "from-orange-500 to-amber-400", streetlights: "from-yellow-500 to-amber-300", water: "from-sky-600 to-sky-400", cleanliness: "from-teal-600 to-emerald-400" };

export default function StreetCarePage() {
  const { t } = useI18n();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [nearbyArea, setNearbyArea] = useState("Finding nearby area…");

  useEffect(() => {
    fetch("/api/complaints").then((r) => r.json()).then((d) => { setComplaints(d.complaints ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationError("Location is not supported by this browser."); setLocationLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (position) => { setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude }); setLocationLoading(false); },
      () => { setLocationError("Allow location access to show your nearby Street Care area."); setLocationLoading(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    fetch("/api/location/reverse?lat=" + userLocation.lat + "&lon=" + userLocation.lon)
      .then((r) => r.json()).then((d) => setNearbyArea(d.area || "Nearby Area")).catch(() => setNearbyArea("Nearby Area"));
  }, [userLocation]);

  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const streetComplaints = useMemo(() => {
    if (!userLocation) return [];
    const nearby = complaints.filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => ({ complaint: c, distance: distanceKm(userLocation.lat, userLocation.lon, Number(c.latitude), Number(c.longitude)) }))
      .sort((a, b) => a.distance - b.distance);
    const withinRadius = nearby.filter((x) => x.distance <= 3);
    return (withinRadius.length ? withinRadius : nearby.slice(0, 5)).map((x) => x.complaint);
  }, [complaints, userLocation]);

  const health = useMemo(() => computeStreetHealth(streetComplaints), [streetComplaints]);
  const offenders = useMemo(() => streetComplaints.filter(isOpen).sort((a, b) => {
    const sevW = (s: string) => (s === "Critical" ? 4 : s === "High" ? 3 : s === "Medium" ? 2 : 1);
    return sevW(b.severity) - sevW(a.severity);
  }).slice(0, 3), [streetComplaints]);

  const grade = health.overall >= 75 ? { label: "Good · improving", color: "text-teal-600", bg: "bg-teal-50 border-teal-200" } : health.overall >= 50 ? { label: "Fair · needs attention", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" } : { label: "Poor · urgent", color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">{t("navStreet")}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">
            <MapPin className="h-3.5 w-3.5" />
            {locationLoading ? "Detecting your nearby area…" : nearbyArea}
          </span>
          <span className="text-xs text-slate-400">Based on your current location</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">{t("streetDesc")}</p>
        {locationError && <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700"><LocateFixed className="h-4 w-4" />{locationError}</div>}
      </div>

      <Card className="relative overflow-hidden p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-50" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-brand-50" />
        <div className="relative flex flex-col items-center">
          <div className="mb-3 flex items-center gap-2 self-start"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 text-white"><HeartPulse className="h-4 w-4" /></span><h2 className="font-display text-base font-bold text-slate-900">{t("streetHealthScore")}</h2></div>
          {loading || locationLoading ? <div className="h-[210px] w-[210px] animate-pulse rounded-full bg-slate-100" /> : <ScoreGauge score={health.overall} label={nearbyArea} sub={grade.label} size={220} />}
          <div className={cn("mt-4 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold", grade.bg, grade.color)}><TrendingUp className="h-3.5 w-3.5" />+4 points this month · 12 fixes verified</div>
          <p className="mt-3 flex max-w-sm items-start gap-1.5 text-center text-[11px] leading-relaxed text-slate-400"><Info className="mt-0.5 h-3 w-3 shrink-0" />Computed live from open, overdue and recurring reports around your current area.</p>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        {health.rows.map((m, i) => { const Icon = METRIC_ICONS[m.id] ?? Sparkles; return <motion.div key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}><div className="mb-1.5 flex items-center justify-between"><p className="flex items-center gap-2 text-[13px] font-bold text-slate-700"><Icon className="h-4 w-4 text-slate-400" />{t(m.id)}{m.open > 0 && <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[9px] font-black text-rose-500">{m.open} open</span>}</p><p className="font-display text-sm font-bold text-slate-800">{m.score}<span className="text-[10px] font-semibold text-slate-400">/100</span></p></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><motion.div initial={{ width: 0 }} animate={{ width: m.score + "%" }} transition={{ delay: 0.25 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className={cn("h-full rounded-full bg-gradient-to-r", METRIC_BAR[m.id])} /></div></motion.div>; })}
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold tracking-tight text-slate-900">What is pulling {nearbyArea} down</h2>
        <div className="space-y-2.5">
          {offenders.length ? offenders.map((c, i) => { const dl = deadlineInfo(c); return <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}><Link href={"/complaints/" + c.id}><Card className="flex items-center gap-3 p-3 transition hover:-translate-y-0.5"><img src={c.photoUrl || "/images/complaints/pothole.jpg"} alt="" className="h-[52px] w-[52px] shrink-0 rounded-2xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-bold text-slate-800">{c.title}</p><p className="text-[11px] text-slate-400">{timeAgo(c.reportedAt)} · {dl.overdue ? <span className="font-bold text-rose-500">{dl.days}d {t("overdue")}</span> : <span className="font-semibold text-teal-600">{dl.days} {t("daysLeft")}</span>}</p></div><SeverityBadge severity={c.severity} /></Card></Link></motion.div>; }) : <Card className="p-5 text-center text-xs text-slate-500">No nearby unresolved problems found.</Card>}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-brand-700 to-teal-600 p-5 text-white shadow-2xl shadow-brand-600/25"><div className="absolute inset-0 grid-bg opacity-20" /><div className="relative flex items-center gap-4"><div className="grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-white/15 p-3.5 backdrop-blur"><TriangleAlert className="h-6 w-6" /></div><div className="flex-1"><p className="font-display text-base font-bold">Spotted something broken?</p><p className="text-[12px] text-blue-100/90">Every verified fix raises your nearby area&apos;s score.</p></div><Link href="/report"><Btn variant="dark" className="bg-white/15 px-4 py-2.5 text-xs backdrop-blur hover:bg-white/25"><Camera className="h-4 w-4" /> {t("reportNow")}</Btn></Link></div></div>

      <Card className="border-brand-100 bg-brand-50/40 p-5"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm"><LocateFixed className="h-5 w-5" /></div><div><h2 className="font-display text-base font-bold text-slate-900">Nearby only</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Street Care automatically uses your browser location and shows complaints around your current area. No manual neighbourhood selection is needed.</p></div></div></Card>
    </div>
  );
}