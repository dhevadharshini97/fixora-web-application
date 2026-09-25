import type { Complaint } from "@/db/schema";
import {
  CATEGORIES,
  DANGER_WORDS,
  SLA_BY_SEVERITY,
  SEVERITY_META,
  STATUS_LADDER,
  type Severity,
} from "./constants";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ---------------- Problem DNA ---------------- */

function fnv(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const hex = (n: number) => n.toString(16).toUpperCase().padStart(4, "0").slice(0, 4);

export function generateProblemDna(input: {
  categoryLabel: string;
  lat: number;
  lon: number;
  time: number;
  description: string;
  photoSignature: string;
}): string {
  const cat =
    CATEGORIES.find((c) => c.label === input.categoryLabel)?.dnaCode ?? "GN";
  const locSeg = hex(
    fnv(`${input.lat.toFixed(3)}|${input.lon.toFixed(3)}|loc`)
  );
  const timeCatSeg = hex(
    fnv(`${input.categoryLabel}|${Math.floor(input.time / 3600000)}|tc`)
  );
  const descSeg = hex(
    fnv(`${input.description.trim().toLowerCase()}|${input.photoSignature}|d`)
  );
  return `FXR-${cat}-${locSeg}-${timeCatSeg}-${descSeg}`;
}

export function photoSignature(dataUrl: string): string {
  if (dataUrl.length < 64) return dataUrl;
  return (
    dataUrl.slice(24, 40) + dataUrl.slice(-24) + String(dataUrl.length % 997)
  );
}

/* ---------------- AI simulation ---------------- */

export function inferCategory(text: string) {
  const t = text.toLowerCase();
  let best = CATEGORIES[CATEGORIES.length - 1];
  let bestScore = 0;
  for (const c of CATEGORIES) {
    const s = c.keywords.reduce(
      (acc, k) => acc + (k.trim() && t.includes(k.trim()) ? 1 : 0),
      0
    );
    if (s > bestScore) {
      bestScore = s;
      best = c;
    }
  }
  return best;
}

export function estimateSeverity(categoryId: string, text: string): Severity {
  const t = text.toLowerCase();
  if (DANGER_WORDS.some((w) => t.includes(w))) return "Critical";
  if (categoryId === "drainage" || categoryId === "garbage") return "High";
  if (categoryId === "road" || categoryId === "water") return "High";
  if (categoryId === "footpath") return "Medium";
  if (categoryId === "streetlight") return "Medium";
  return "Low";
}

export function titleFromDescription(text: string, categoryLabel: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return `${categoryLabel} reported near you`;
  const first = clean.split(/[.!?\n]/)[0];
  const short = first.length > 64 ? first.slice(0, 64) + "…" : first;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/* ---------------- Geo ---------------- */

export function haversineMeters(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ---------------- Time ---------------- */

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function formatDateShort(d: Date) {
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function deadlineInfo(c: Complaint) {
  if (!c.deadline) return { days: 0, overdue: false };
  const ms = new Date(c.deadline).getTime() - Date.now();
  const days = Math.round(Math.abs(ms) / 86400000);
  return { days, overdue: ms < 0 };
}

/* ---------------- Status helpers ---------------- */

export function statusIndex(status: string) {
  const i = STATUS_LADDER.indexOf(status as (typeof STATUS_LADDER)[number]);
  return i === -1 ? 0 : i;
}

export function isOpen(c: Complaint) {
  return c.status !== "resolved" && c.status !== "verified";
}

/* ---------------- Street Health Score ---------------- */

export function computeStreetHealth(complaints: Complaint[]) {
  const metrics: Record<string, number> = {
    roads: 92,
    drainage: 92,
    garbage: 92,
    streetlights: 92,
    water: 92,
    cleanliness: 92,
  };
  const openCount: Record<string, number> = {
    roads: 0,
    drainage: 0,
    garbage: 0,
    streetlights: 0,
    water: 0,
    cleanliness: 0,
  };

  for (const c of complaints) {
    const def = CATEGORIES.find((k) => k.label === c.category);
    const metric = def?.metric ?? "cleanliness";
    const sev = (c.severity as Severity) || "Medium";
    const w = SEVERITY_META[sev]?.weight ?? 7;
    const { overdue } = deadlineInfo(c);
    if (c.status === "resolved" || c.status === "verified") {
      metrics[metric] += 3;
    } else {
      let penalty = w;
      if (overdue) penalty += 5;
      if (c.status === "reopened") penalty += 8;
      metrics[metric] -= penalty;
      openCount[metric] += 1;
      if (metric === "garbage") {
        metrics.cleanliness -= Math.round(penalty * 0.5);
      }
    }
  }

  const rows = Object.entries(metrics).map(([id, score]) => ({
    id,
    score: Math.max(20, Math.min(96, Math.round(score))),
    open: openCount[id],
  }));
  const overall = Math.round(
    rows.reduce((a, r) => a + r.score, 0) / rows.length
  );
  return { overall, rows };
}

/* ---------------- Image ---------------- */

export function resizeImage(
  source: File | string,
  maxDim = 1000,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no ctx"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    if (typeof source === "string") {
      img.src = source;
    } else {
      const url = URL.createObjectURL(source);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = url;
    }
  });
}

/* ---------------- Local profile ---------------- */

export interface LocalProfile {
  fullName: string;
  age: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  language: string;
  photo: string | null;
}

export function getProfile(): LocalProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fixora_profile");
    return raw ? (JSON.parse(raw) as LocalProfile) : null;
  } catch {
    return null;
  }
}

export function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "goodMorning";
  if (h < 17) return "goodAfternoon";
  return "goodEvening";
}

export const SLA = SLA_BY_SEVERITY;
