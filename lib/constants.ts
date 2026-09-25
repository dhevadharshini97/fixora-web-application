export type Severity = "Critical" | "High" | "Medium" | "Low";

export const LANGUAGES = [
  { code: "en", name: "English", native: "English", speech: "en-IN" },
  { code: "ta", name: "Tamil", native: "தமிழ்", speech: "ta-IN" },
  { code: "hi", name: "Hindi", native: "हिन्दी", speech: "hi-IN" },
  { code: "te", name: "Telugu", native: "తెలుగు", speech: "te-IN" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", speech: "ml-IN" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "mr", name: "Marathi", native: "मराठी", speech: "mr-IN" },
  { code: "bn", name: "Bengali", native: "বাংলা", speech: "bn-IN" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", speech: "gu-IN" },
];

export interface CategoryDef {
  id: string;
  label: string;
  dept: string;
  dnaCode: string;
  metric: string;
  photo: string;
  keywords: string[];
  rootCause: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "road",
    label: "Road Damage",
    dept: "Roads & Infrastructure Dept",
    dnaCode: "RD",
    metric: "roads",
    photo: "/images/complaints/pothole.jpg",
    keywords: ["pothole", "road", "crater", "asphalt", "bump", "zebra", "crossing", "patch", " crater"],
    rootCause:
      "Water seepage weakened the sub-base layer; repeated heavy-axle loads broke the asphalt surface. Pattern matches pre-monsoon failure zones.",
  },
  {
    id: "garbage",
    label: "Garbage & Waste",
    dept: "Sanitation & Solid Waste Dept",
    dnaCode: "GB",
    metric: "garbage",
    photo: "/images/complaints/garbage.jpg",
    keywords: ["garbage", "trash", "waste", "bin", "dump", "litter", "smell", "dirty", "kuppai"],
    rootCause:
      "Collection frequency is below the waste generation rate for this ward density; no backup compactor assigned on skipped routes.",
  },
  {
    id: "streetlight",
    label: "Streetlight",
    dept: "Electrical & Streetlight Dept",
    dnaCode: "SL",
    metric: "streetlights",
    photo: "/images/complaints/streetlight.jpg",
    keywords: ["light", "streetlight", "lamp", "dark", "pole", "electricity"],
    rootCause:
      "Corroded feeder cable joint allowed moisture ingress, tripping the local mini feeder pillar breaker for this stretch.",
  },
  {
    id: "drainage",
    label: "Drainage & Waterlogging",
    dept: "Stormwater Drainage Dept",
    dnaCode: "DG",
    metric: "drainage",
    photo: "/images/complaints/waterlogging.jpg",
    keywords: ["drain", "drainage", "flood", "waterlog", "sewage", "overflow", "stagnant", "block", "mosquito"],
    rootCause:
      "Silt and plastic choke the lateral drain connection; outfall capacity is undersized for peak monsoon flow in this catchment.",
  },
  {
    id: "water",
    label: "Water Leakage",
    dept: "Water Supply Board",
    dnaCode: "WL",
    metric: "water",
    photo: "/images/complaints/waterlogging.jpg",
    keywords: ["leak", "pipe", "supply", "burst", "drinking", "wastage"],
    rootCause:
      "Ageing CI main with corroded joint collar; pressure surge after the recent pump schedule change ruptured the joint.",
  },
  {
    id: "footpath",
    label: "Footpath & Walkways",
    dept: "Roads & Infrastructure Dept",
    dnaCode: "FP",
    metric: "roads",
    photo: "/images/complaints/sidewalk.jpg",
    keywords: ["footpath", "sidewalk", "pavement", "walk", "slab", "tiles", "walkway"],
    rootCause:
      "Vehicles mount the footpath due to missing bollards; tiles crack under axle load and displaced slabs are never re-seated.",
  },
  {
    id: "other",
    label: "Other Public Issue",
    dept: "Ward Office (General)",
    dnaCode: "GN",
    metric: "cleanliness",
    photo: "/images/complaints/pothole.jpg",
    keywords: [],
    rootCause:
      "Recurring civic maintenance gap identified; requires a ward-level inspection to confirm the underlying systemic cause.",
  },
];

export const DANGER_WORDS = [
  "danger", "urgent", "school", "accident", "hospital", "child", "children",
  "fire", "live wire", "collapse", "dengue", "emergency", "death", "injury",
];

export const SLA_BY_SEVERITY: Record<Severity, number> = {
  Critical: 2,
  High: 5,
  Medium: 10,
  Low: 20,
};

export const ESCALATION_LEVELS = [
  "Field Officer",
  "Ward Supervisor",
  "Zonal Engineer",
  "Commissioner",
];

export const STATUS_LADDER = [
  "submitted",
  "ai_verified",
  "assigned",
  "in_progress",
  "resolved",
  "verified",
] as const;

export const DEFAULT_LOC = {
  lat: 13.0405,
  lon: 80.2337,
  street: "Pondy Bazaar, T. Nagar",
  city: "Chennai",
};

export const PRESET_AREAS = [
  { name: "T. Nagar — Pondy Bazaar", lat: 13.0418, lon: 80.2341 },
  { name: "Anna Nagar — 2nd Avenue", lat: 13.0878, lon: 80.2105 },
  { name: "Velachery — Main Road", lat: 13.0067, lon: 80.2206 },
  { name: "Adyar — LB Road", lat: 13.0098, lon: 80.2573 },
  { name: "Mylapore — Kutchery Road", lat: 13.0327, lon: 80.2688 },
  { name: "Porur — Signal Junction", lat: 13.0382, lon: 80.1565 },
  { name: "Guindy — Kathipara", lat: 13.0108, lon: 80.2129 },
  { name: "Tambaram — GST Road", lat: 12.9249, lon: 80.1275 },
  { name: "Chromepet — School Road", lat: 12.9516, lon: 80.1462 },
];

export const SEVERITY_META: Record<
  Severity,
  { color: string; bg: string; dot: string; weight: number }
> = {
  Critical: { color: "text-rose-600", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500", weight: 18 },
  High: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500", weight: 12 },
  Medium: { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", weight: 7 },
  Low: { color: "text-sky-600", bg: "bg-sky-50 border-sky-200", dot: "bg-sky-500", weight: 3 },
};

export const statusLabelKey: Record<string, string> = {
  submitted: "stSubmitted",
  ai_verified: "stAiVerified",
  assigned: "stAssigned",
  in_progress: "stInProgress",
  resolved: "stResolved",
  verified: "stVerification",
  reopened: "stReopened",
};

export const STATUS_META: Record<string, { chip: string; bar: string }> = {
  submitted: { chip: "bg-slate-100 text-slate-600 border-slate-200", bar: "bg-slate-400" },
  ai_verified: { chip: "bg-cyan-50 text-cyan-700 border-cyan-200", bar: "bg-cyan-500" },
  assigned: { chip: "bg-blue-50 text-blue-700 border-blue-200", bar: "bg-blue-500" },
  in_progress: { chip: "bg-indigo-50 text-indigo-700 border-indigo-200", bar: "bg-indigo-500" },
  resolved: { chip: "bg-teal-50 text-teal-700 border-teal-200", bar: "bg-teal-500" },
  verified: { chip: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-500" },
  reopened: { chip: "bg-rose-50 text-rose-700 border-rose-200", bar: "bg-rose-500" },
};

export const CATEGORY_PHOTO: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.label, c.photo])
);
