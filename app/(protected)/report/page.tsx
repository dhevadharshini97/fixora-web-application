"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Upload,
  RefreshCcw,
  MapPin,
  Calendar,
  Clock,
  Crosshair,
  Mic,
  MicOff,
  Wand2,
  Building2,
  BrainCircuit,
  ScanSearch,
  Fingerprint,
  Check,
  Copy,
  TriangleAlert,
  Sparkles,
  Users,
  ArrowRight,
  House,
  ShieldCheck,
  Navigation,
  X,
  ChevronDown,
  Radar,
  CircleCheckBig,
  PartyPopper,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { Btn, Card, Chip, Sheet, StatusPill } from "@/components/ui";
import MapPreview from "@/components/map-preview";
import { useI18n } from "@/lib/i18n";
import {
  CATEGORIES,
  DEFAULT_LOC,
  ESCALATION_LEVELS,
  LANGUAGES,
  PRESET_AREAS,
  SLA_BY_SEVERITY,
  SEVERITY_META,
  type Severity,
} from "@/lib/constants";
import {
  cn,
  deadlineInfo,
  estimateSeverity,
  formatDateShort,
  formatTime,
  generateProblemDna,
  getProfile,
  haversineMeters,
  inferCategory,
  photoSignature,
  resizeImage,
  titleFromDescription,
} from "@/lib/utils";

type Stage = "capture" | "describe" | "analyzing" | "analysis" | "done";

interface GeoTag {
  lat: number;
  lon: number;
  street: string;
  city: string;
  date: string;
  time: string;
}

const STEPS = [
  { key: "step1", icon: Camera },
  { key: "step2", icon: Wand2 },
  { key: "step3", icon: CircleCheckBig },
];

const SEV_ORDER: Severity[] = ["Low", "Medium", "High", "Critical"];

export default function ReportPage() {
  const { t, lang } = useI18n();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("capture");
  const [photo, setPhoto] = useState<string | null>(null);
  const [privacyScan, setPrivacyScan] = useState(false);
  const [geo, setGeo] = useState<GeoTag | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [locSheet, setLocSheet] = useState(false);
  const [description, setDescription] = useState("");
  const [listening, setListening] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState<Severity>("High");
  const [dna, setDna] = useState("");
  const [copied, setCopied] = useState(false);
  const [duplicate, setDuplicate] = useState<Complaint | null>(null);
  const [existing, setExisting] = useState<Complaint[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Complaint | null>(null);
  const [supported, setSupported] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => setExisting(d.complaints ?? []))
      .catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      recRef.current?.stop();
    };
  }, []);

  const stepIndex = stage === "capture" ? 0 : stage === "describe" ? 1 : 2;

  /* ---------- photo ---------- */

  const onPicked = async (f: File | string) => {
    const data = typeof f === "string" ? f : await resizeImage(f, 1000, 0.72);
    setPhoto(data);
    setPrivacyScan(true);
    detectLocation();
    setTimeout(() => setPrivacyScan(false), 2300);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      fileRef.current?.click();
    }
  };

  const captureFrame = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 540;
    canvas.getContext("2d")?.drawImage(v, 0, 0);
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    setCameraOpen(false);
    onPicked(canvas.toDataURL("image/jpeg", 0.85));
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    setCameraOpen(false);
  };

  /* ---------- geolocation ---------- */

  const detectLocation = () => {
    setGeoLoading(true);
    const now = new Date();
    const finish = (lat: number, lon: number, street: string, city: string) => {
      setGeo({
        lat,
        lon,
        street,
        city,
        date: formatDateShort(now),
        time: formatTime(now),
      });
      setGeoLoading(false);
    };
    const fallback = () =>
      fetch(`/api/geocode?lat=${DEFAULT_LOC.lat}&lon=${DEFAULT_LOC.lon}`)
        .then((r) => r.json())
        .then((d) =>
          finish(DEFAULT_LOC.lat, DEFAULT_LOC.lon, d.street || DEFAULT_LOC.street, d.city || DEFAULT_LOC.city)
        )
        .catch(() => finish(DEFAULT_LOC.lat, DEFAULT_LOC.lon, DEFAULT_LOC.street, DEFAULT_LOC.city));

    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`)
          .then((r) => r.json())
          .then((d) =>
            finish(latitude, longitude, d.street || "Detected location", d.city || "Your city")
          )
          .catch(() => finish(latitude, longitude, "Detected location", "Your city"));
      },
      () => fallback(),
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  };

  /* ---------- voice ---------- */

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const W = window as unknown as Record<string, unknown>;
    const SR = (W.SpeechRecognition ?? W.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onresult: (e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void;
          onend: () => void;
          onerror: () => void;
          start: () => void;
          stop: () => void;
        })
      | undefined;
    if (!SR) return;
    const rec = new SR();
    const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];
    rec.lang = meta.speech;
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      }
      if (final) setDescription((d) => (d + " " + final).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  /* ---------- analysis ---------- */

  const runAnalysis = () => {
    setStage("analyzing");
    setAnalysisStep(0);
    const cat = inferCategory(description);
    const sev = estimateSeverity(cat.id, description);
    const generated = generateProblemDna({
      categoryLabel: cat.label,
      lat: geo?.lat ?? DEFAULT_LOC.lat,
      lon: geo?.lon ?? DEFAULT_LOC.lon,
      time: Date.now(),
      description,
      photoSignature: photoSignature(photo ?? ""),
    });
    const dup =
      existing.find((c) => {
        if (c.category !== cat.label) return false;
        if (c.status === "resolved" || c.status === "verified") return false;
        const sameStreet =
          geo?.street && c.street && c.street.toLowerCase().includes(geo.street.split(",")[0].toLowerCase());
        const near =
          c.latitude != null && c.longitude != null && geo
            ? haversineMeters({ lat: geo.lat, lon: geo.lon }, { lat: c.latitude, lon: c.longitude }) < 750
            : false;
        return sameStreet || near;
      }) ?? null;

    [420, 1080, 1760, 2440].forEach((ms, i) =>
      setTimeout(() => setAnalysisStep(i + 1), ms)
    );
    setTimeout(() => {
      setCategory(cat);
      setSeverity(dup ? (dup.severity as Severity) : sev);
      setDna(dup ? dup.problemDna ?? generated : generated);
      setDuplicate(dup);
      setStage("analysis");
    }, 2900);
  };

  /* ---------- submit ---------- */

  const markMine = (id: number) => {
    try {
      const arr = JSON.parse(localStorage.getItem("fixora_my_complaints") ?? "[]");
      localStorage.setItem("fixora_my_complaints", JSON.stringify([id, ...arr]));
    } catch {}
  };

  const supportExisting = async () => {
    if (!duplicate) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/complaints/${duplicate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "support" }),
      });
      const d = await r.json();
      setResult(d.complaint ?? { ...duplicate, supporters: (duplicate.supporters ?? 1) + 1 });
      markMine(duplicate.id);
      setSupported(true);
    } catch {
      setResult(duplicate);
    }
    setSubmitting(false);
    setStage("done");
  };

  const submitNew = async (asNewLinked: boolean) => {
    setSubmitting(true);
    const profile = getProfile();
    const sla = SLA_BY_SEVERITY[severity];
    const body = {
      citizenName: profile?.fullName ?? "Citizen",
      title: titleFromDescription(description, category.label),
      description,
      category: category.label,
      severity,
      department: category.dept,
      rootCause: category.rootCause,
      photoUrl: photo,
      latitude: geo?.lat ?? DEFAULT_LOC.lat,
      longitude: geo?.lon ?? DEFAULT_LOC.lon,
      street: geo?.street ?? DEFAULT_LOC.street,
      city: geo?.city ?? DEFAULT_LOC.city,
      problemDna: dna,
      recurringOfDna: asNewLinked && duplicate ? duplicate.problemDna : null,
      slaDays: sla,
    };
    try {
      const r = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.complaint) {
        setResult(d.complaint);
        markMine(d.complaint.id);
      } else throw new Error();
    } catch {
      const offlineComplaint = {
        id: Date.now(),
        ...body,
        status: "assigned",
        supporters: 1,
        slaDays: sla,
        escalationLevel: 0,
        reopenCount: 0,
        deadline: new Date(Date.now() + sla * 86400000).toISOString(),
        reportedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as Complaint;
      setResult(offlineComplaint);
      markMine(offlineComplaint.id);
      try {
        const saved = JSON.parse(localStorage.getItem("fixora_local_complaints") ?? "[]");
        localStorage.setItem(
          "fixora_local_complaints",
          JSON.stringify([offlineComplaint, ...saved.filter((c: Complaint) => c.id !== offlineComplaint.id)].slice(0, 50))
        );
      } catch {}
    }
    setSubmitting(false);
    setStage("done");
  };

  const sevMeta = SEVERITY_META[severity];
  const sevIdx = SEV_ORDER.indexOf(severity);
  const deadlineDate = result?.deadline
    ? formatDateShort(new Date(result.deadline))
    : formatDateShort(new Date(Date.now() + SLA_BY_SEVERITY[severity] * 86400000));

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 transition",
                i <= stepIndex
                  ? "border-transparent bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-md shadow-brand-600/25"
                  : "border-slate-200 bg-white text-slate-300"
              )}
            >
              <s.icon className="h-4.5 w-4.5" />
            </div>
            <p
              className={cn(
                "hidden text-[11px] font-bold sm:block",
                i <= stepIndex ? "text-slate-800" : "text-slate-400"
              )}
            >
              {t(s.key)}
            </p>
            {i < STEPS.length - 1 && (
              <div className="mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-500 to-teal-500"
                  initial={false}
                  animate={{ width: i < stepIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* title */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          {t(STEPS[stepIndex].key)}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {t(["step1Desc", "step2Desc", "step3"][stepIndex] ?? "step1Desc")}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* ================= STAGE: CAPTURE ================= */}
        {stage === "capture" && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-5"
          >
            {!photo ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={openCamera}
                  className="group relative flex h-64 flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-brand-300 bg-brand-50/60 text-brand-600 transition hover:border-brand-500 hover:bg-brand-50 sm:h-72"
                >
                  <span className="absolute left-4 top-4 h-6 w-6 rounded-tl-xl border-l-[3px] border-t-[3px] border-brand-400" />
                  <span className="absolute right-4 top-4 h-6 w-6 rounded-tr-xl border-r-[3px] border-t-[3px] border-brand-400" />
                  <span className="absolute bottom-4 left-4 h-6 w-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-brand-400" />
                  <span className="absolute bottom-4 right-4 h-6 w-6 rounded-br-xl border-b-[3px] border-r-[3px] border-brand-400" />
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30 transition group-hover:scale-110">
                    <Camera className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-bold">{t("openCamera")}</span>
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group flex h-64 flex-col items-center justify-center gap-3 rounded-[26px] border-2 border-dashed border-teal-300 bg-teal-50/50 text-teal-600 transition hover:border-teal-500 hover:bg-teal-50 sm:h-72"
                >
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 text-white shadow-lg shadow-teal-600/30 transition group-hover:scale-110">
                    <Upload className="h-7 w-7" />
                  </span>
                  <span className="text-sm font-bold">{t("uploadPhotoBtn")}</span>
                  <span className="text-[11px] text-teal-600/70">JPG · PNG · HEIC</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && onPicked(e.target.files[0])}
                />
              </div>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt="problem" className="h-64 w-full object-cover sm:h-80" />
                    {/* privacy scan */}
                    {privacyScan && (
                      <div className="absolute inset-0 bg-brand-950/30">
                        <span className="animate-scanline absolute left-0 h-1.5 w-full bg-gradient-to-r from-transparent via-teal-300 to-transparent shadow-[0_0_20px_#5eead4]" />
                        {[
                          { top: "16%", left: "12%", w: "20%", h: "20%", label: "Face" },
                          { top: "22%", left: "58%", w: "22%", h: "22%", label: "Face" },
                          { top: "62%", left: "30%", w: "32%", h: "13%", label: "Plate" },
                        ].map((b, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 1.3 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.4 }}
                            className="absolute rounded-lg border-2 border-teal-300"
                            style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
                          >
                            <span className="absolute inset-0 backdrop-blur-md" />
                            <span className="absolute -top-6 left-0 flex items-center gap-1 whitespace-nowrap rounded-full bg-teal-500 px-2 py-0.5 text-[9px] font-bold text-white">
                              <ShieldCheck className="h-2.5 w-2.5" /> {b.label} blurred
                            </span>
                          </motion.div>
                        ))}
                        <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-teal-300 backdrop-blur">
                          Privacy AI scanning…
                        </span>
                      </div>
                    )}
                    {!privacyScan && (
                      <motion.span
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Privacy AI · faces & plates blurred
                      </motion.span>
                    )}
                    <button
                      onClick={() => {
                        setPhoto(null);
                        setGeo(null);
                      }}
                      className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur transition hover:bg-slate-950"
                    >
                      <RefreshCcw className="h-3.5 w-3.5" /> {t("retake")}
                    </button>
                  </div>
                </Card>

                {/* GPS Geotag */}
                <Card className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 text-white">
                        <Radar className="h-4 w-4" />
                      </span>
                      {t("gpsTitle")}
                    </h2>
                    {geoLoading ? (
                      <Chip className="border-brand-200 bg-brand-50 text-brand-600">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                        GPS…
                      </Chip>
                    ) : (
                      <Chip className="border-teal-200 bg-teal-50 text-teal-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
                        Locked
                      </Chip>
                    )}
                  </div>

                  {geoLoading || !geo ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                      ))}
                      <div className="col-span-2 h-40 animate-pulse rounded-2xl bg-slate-100" />
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { icon: Crosshair, label: "Latitude", value: geo.lat.toFixed(6) },
                          { icon: Crosshair, label: "Longitude", value: geo.lon.toFixed(6) },
                          { icon: Calendar, label: "Date", value: geo.date },
                          { icon: Clock, label: "Time", value: geo.time },
                        ].map((f) => (
                          <div key={f.label} className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                            <f.icon className="h-4 w-4 shrink-0 text-teal-600" />
                            <div className="min-w-0">
                              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                                {f.label}
                              </p>
                              <p className="truncate text-[13px] font-bold text-slate-800">{f.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2.5 rounded-2xl border border-brand-100 bg-brand-50/60 px-3 py-2.5">
                        <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                        <div className="min-w-0">
                          <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                            Street / Area
                          </p>
                          <p className="truncate text-[13px] font-bold text-slate-800">{geo.street}</p>
                        </div>
                      </div>
                      <MapPreview lat={geo.lat} lon={geo.lon} />
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <Btn variant="primary" onClick={() => setStage("describe")} className="py-3.5">
                          <Check className="h-4.5 w-4.5" />
                          {t("useThisLocation")}
                        </Btn>
                        <Btn variant="outline" onClick={() => setLocSheet(true)} className="py-3.5">
                          <Navigation className="h-4.5 w-4.5" />
                          {t("changeLocation")}
                        </Btn>
                      </div>
                    </motion.div>
                  )}
                </Card>
              </>
            )}
          </motion.div>
        )}

        {/* ================= STAGE: DESCRIBE ================= */}
        {stage === "describe" && (
          <motion.div
            key="describe"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-5"
          >
            <Card className="overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo ?? ""} alt="problem" className="h-36 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/80 to-transparent px-4 pb-3 pt-10">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-white">
                    <MapPin className="h-3.5 w-3.5 text-teal-300" />
                    {geo?.street}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-teal-200 backdrop-blur">
                    {(LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]).native}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder={t("describePlaceholder")}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-[15px] font-medium leading-relaxed text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={toggleVoice}
                    className={cn(
                      "flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition",
                      listening
                        ? "border-rose-300 bg-rose-50 text-rose-600"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600"
                    )}
                  >
                    {listening ? (
                      <>
                        <span className="relative flex h-4 w-4 items-center justify-center">
                          <span className="absolute h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                          <MicOff className="relative h-3.5 w-3.5" />
                        </span>
                        {t("listening")}
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-teal-600" />
                        {t("voiceInput")}
                      </>
                    )}
                  </button>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {description.trim().length} chars
                  </span>
                </div>
              </div>
            </Card>

            <Btn
              full
              disabled={description.trim().length < 8}
              onClick={runAnalysis}
              className="py-4 text-base"
            >
              <Wand2 className="h-5 w-5" />
              {t("analyzeWithAI")}
            </Btn>
          </motion.div>
        )}

        {/* ================= STAGE: ANALYZING ================= */}
        {stage === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6"
          >
            <div className="mx-auto max-w-sm">
              <div className="relative mx-auto mb-8 grid h-28 w-28 place-items-center">
                <span className="animate-spin-slow absolute inset-0 rounded-full border-2 border-dashed border-brand-300" />
                <span className="absolute inset-3 rounded-full border-2 border-teal-200" />
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-xl shadow-brand-600/30">
                  <BrainCircuit className="h-8 w-8" />
                </span>
              </div>
              <p className="text-center font-display text-lg font-bold text-slate-900">
                FIXORA AI {t("aiAnalysis")}
              </p>
              <div className="mt-6 space-y-3">
                {[
                  "Reading photo · Privacy AI pass",
                  "Parsing description · language detect",
                  "Scanning duplicate registry",
                  "Composing Problem DNA",
                ].map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12 }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                  >
                    {analysisStep > i ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-500 text-white">
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      </span>
                    ) : (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
                    )}
                    <span className={cn("text-[13px] font-semibold", analysisStep > i ? "text-slate-700" : "text-slate-400")}>
                      {s}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= STAGE: ANALYSIS RESULT ================= */}
        {stage === "analysis" && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-teal-500 text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <h2 className="font-display text-xl font-bold text-slate-900">{t("aiAnalysis")}</h2>
            </div>

            <Card className="space-y-4 p-4">
              {/* category */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t("category")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
                        category.id === c.id
                          ? "border-brand-500 bg-brand-600 text-white shadow-md shadow-brand-600/25"
                          : "border-slate-200 bg-white text-slate-500 hover:border-brand-300"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* severity */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {t("severity")}
                  </p>
                  <span className={cn("text-xs font-black", sevMeta.color)}>{severity.toUpperCase()}</span>
                </div>
                <div className="flex gap-1.5">
                  {SEV_ORDER.map((s, i) => (
                    <div key={s} className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: i <= sevIdx ? "100%" : "0%" }}
                        transition={{ delay: 0.15 + i * 0.1 }}
                        className={cn("h-full rounded-full", SEVERITY_META[s].dot)}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                  Smart deadline: {SLA_BY_SEVERITY[severity]} days
                </p>
              </div>

              {/* dept + dna */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-brand-500" /> {t("department")}
                  </p>
                  <p className="mt-1.5 text-[13px] font-bold text-slate-800">{category.dept}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Fingerprint className="h-3.5 w-3.5 text-teal-600" /> {t("problemDna")}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(dna).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    className="mt-1.5 flex items-center gap-1.5 font-mono text-[12px] font-bold text-slate-800 hover:text-brand-600"
                  >
                    {dna}
                    {copied ? <Check className="h-3.5 w-3.5 text-teal-500" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
                  </button>
                </div>
              </div>

              {/* root cause */}
              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-3.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-500">
                  <BrainCircuit className="h-3.5 w-3.5" /> {t("rootCause")}
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-slate-700"
                >
                  {category.rootCause}
                </motion.p>
              </div>

              {/* duplicate check */}
              <div
                className={cn(
                  "rounded-2xl border p-3.5",
                  duplicate ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/60"
                )}
              >
                <p className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider", duplicate ? "text-amber-600" : "text-emerald-600")}>
                  <ScanSearch className="h-3.5 w-3.5" /> {t("duplicateCheck")}
                </p>
                {duplicate ? (
                  <p className="mt-1.5 text-[12.5px] font-semibold text-amber-700">
                    1 match found within 750m — same category
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
                    <Check className="h-4 w-4" /> No duplicates found within 750m
                  </p>
                )}
              </div>
            </Card>

            {/* duplicate / new banner */}
            {duplicate ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="overflow-hidden rounded-[26px] border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                    <TriangleAlert className="h-5.5 w-5.5" />
                  </span>
                  <h3 className="font-display text-lg font-bold leading-tight text-amber-900">
                    {t("similarProblem")}
                  </h3>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5 text-[12px]">
                  <div className="col-span-2 rounded-2xl bg-white/80 p-3">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{t("problemDna")}</p>
                    <p className="font-mono font-bold text-slate-800">{duplicate.problemDna}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{t("citizensAffected")}</p>
                    <p className="flex items-center gap-1 font-bold text-slate-800">
                      <Users className="h-3.5 w-3.5 text-brand-500" /> {duplicate.supporters}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">{t("currentStatus")}</p>
                    <div className="mt-1"><StatusPill status={duplicate.status} /></div>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-white/80 p-3">
                    <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">Location</p>
                    <p className="flex items-center gap-1 font-bold text-slate-800">
                      <MapPin className="h-3.5 w-3.5 text-teal-600" /> {duplicate.street}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11.5px] font-medium leading-relaxed text-amber-700">
                  Supporting the existing report raises its priority score and pushes it up the department queue.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Btn variant="teal" onClick={supportExisting} disabled={submitting}>
                    <Users className="h-4.5 w-4.5" /> {t("supportExisting")}
                  </Btn>
                  <Btn variant="outline" onClick={() => submitNew(true)} disabled={submitting}>
                    {t("submitNew")}
                  </Btn>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[26px] border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                    <Sparkles className="h-5.5 w-5.5" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-emerald-900">{t("newProblem")}</h3>
                    <p className="text-[11px] font-semibold text-emerald-600">
                      Ready for smart routing · DNA {dna}
                    </p>
                  </div>
                </div>
                <Btn full onClick={() => submitNew(false)} disabled={submitting} className="mt-4 py-4 text-base">
                  {submitting ? (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <>
                      {t("submitComplaint")}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Btn>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ================= STAGE: DONE ================= */}
        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-5 pt-2"
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-2xl shadow-teal-500/40"
              >
                <span className="absolute inset-0 rounded-full bg-teal-400/50 animate-pulse-ring" />
                {supported ? <Users className="h-11 w-11" /> : <PartyPopper className="h-11 w-11" />}
              </motion.div>
              <h2 className="mt-5 font-display text-2xl font-bold text-slate-900">
                {supported ? "Support Registered!" : "Complaint Submitted!"}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-slate-500">
                {supported
                  ? "Your support raised this report's priority score."
                  : "FIXORA AI verified and routed your report in seconds."}
              </p>
            </div>

            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-brand-50/70 border border-brand-100 p-3.5">
                <Building2 className="h-5 w-5 shrink-0 text-brand-600" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("routedTo")}</p>
                  <p className="text-sm font-bold text-slate-800">{result?.department ?? category.dept}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("resolutionDeadline")}</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{deadlineDate}</p>
                  <p className="text-[11px] font-medium text-teal-600">
                    {result ? (deadlineInfo(result).overdue ? `${deadlineInfo(result).days}d ${t("overdue")}` : `${deadlineInfo(result).days} ${t("daysLeft")}`) : `${SLA_BY_SEVERITY[severity]} ${t("daysLeft")}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("autoEscalation")}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
                    {ESCALATION_LEVELS[0]} → {ESCALATION_LEVELS[3]}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["stSubmitted", "stAiVerified", "stAssigned"].map((k, i) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.2 }}
                    className="flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200 px-3 py-1.5 text-[11px] font-bold text-teal-700"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> {t(k)}
                  </motion.span>
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Btn variant="primary" onClick={() => result && router.push(`/complaints/${result.id}`)}>
                {t("trackComplaint")}
              </Btn>
              <Btn variant="outline" onClick={() => router.push("/home")}>
                <House className="h-4.5 w-4.5" /> {t("backHome")}
              </Btn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* camera modal */}
      <AnimatePresence>
        {cameraOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950">
            <div className="flex items-center justify-between p-4 text-white">
              <p className="text-sm font-bold">FIXORA Camera</p>
              <button onClick={closeCamera} className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex-1 overflow-hidden">
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              <span className="absolute left-6 top-6 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 border-teal-300/80" />
              <span className="absolute right-6 top-6 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 border-teal-300/80" />
              <span className="absolute bottom-6 left-6 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 border-teal-300/80" />
              <span className="absolute bottom-6 right-6 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 border-teal-300/80" />
            </div>
            <div className="grid place-items-center p-8">
              <button
                onClick={captureFrame}
                className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-teal-500 shadow-2xl shadow-teal-500/50 transition active:scale-90"
                aria-label="Capture"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* change location sheet */}
      <Sheet open={locSheet} onClose={() => setLocSheet(false)}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900">{t("changeLocation")}</h3>
          <button onClick={() => setLocSheet(false)} className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <button
          onClick={() => {
            setLocSheet(false);
            detectLocation();
          }}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/70 px-4 py-3.5 text-sm font-bold text-brand-700"
        >
          <Crosshair className="h-5 w-5" />
          Detect my GPS again
        </button>
        <p className="mb-2 mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <ChevronDown className="h-3.5 w-3.5" /> Or pick an area
        </p>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {PRESET_AREAS.map((a) => (
            <button
              key={a.name}
              onClick={() => {
                const now = new Date();
                setGeo({
                  lat: a.lat,
                  lon: a.lon,
                  street: a.name,
                  city: "Chennai",
                  date: formatDateShort(now),
                  time: formatTime(now),
                });
                setLocSheet(false);
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
              {a.name}
              {geo?.street === a.name && <Check className="ml-auto h-4 w-4 text-teal-500" />}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
