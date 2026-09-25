"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  SendHorizonal,
  User,
  MapPin,
  TriangleAlert,
  Building2,
  ArrowRight,
  BadgeCheck,
  RotateCcw,
  Timer,
} from "lucide-react";
import type { Complaint } from "@/db/schema";
import { useI18n } from "@/lib/i18n";
import { deadlineInfo, isOpen, getProfile } from "@/lib/utils";
import { CATEGORIES, ESCALATION_LEVELS } from "@/lib/constants";

interface Msg {
  id: number;
  role: "user" | "bot";
  text: string;
  links?: { label: string; href: string }[];
}

const QUICK = ["q1", "q2", "q3", "q4", "q5"] as const;

export default function AssistantPage() {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [myIds, setMyIds] = useState<number[]>([]);
  const idRef = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = getProfile();
    const name = p?.fullName?.split(" ")[0];
    setMessages([
      {
        id: 0,
        role: "bot",
        text: name ? `Hi ${name}! ${t("aiGreeting")}` : t("aiGreeting"),
      },
    ]);
    try {
      setMyIds(JSON.parse(localStorage.getItem("fixora_my_complaints") ?? "[]"));
    } catch {}
    fetch("/api/complaints")
      .then((r) => r.json())
      .then((d) => setComplaints(d.complaints ?? []))
      .catch(() => {});
  }, [t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const answer = (raw: string): Msg => {
    const q = raw.toLowerCase();
    const open = complaints.filter(isOpen);
    const overdue = open.filter((c) => deadlineInfo(c).overdue);
    const mine = complaints.filter((c) => myIds.includes(c.id));
    const id = idRef.current++;

    if (/(near|close|around|area|அருகில்|पास|సమీప|ಅಡుత್|ಬಳಿ|आजूबाजू|আশেপাশে|આસપાસ)/.test(q)) {
      const top = open.slice(0, 3);
      const list = top
        .map((c) => `• ${c.title} — ${c.street} (${c.severity})`)
        .join("\n");
      return {
        id,
        role: "bot",
        text: `I scanned the live registry around your area. There are ${open.length} open reports. The hottest ones right now:\n\n${list}\n\nTap a report to see live tracking, or add your support to raise its priority.`,
        links: [
          { label: "View all nearby problems", href: "/unresolved" },
          { label: "Report a new problem", href: "/report" },
        ],
      };
    }

    if (/(delay|late|waiting|slow|தாமத|देरी|ఆలస్య|താമസ|ತಡ|विलंब|বিলম্ব|વિલંબ)/.test(q)) {
      const target = mine[0] ?? overdue[0];
      if (target) {
        const dl = deadlineInfo(target);
        const level = ESCALATION_LEVELS[Math.min(3, target.escalationLevel ?? 0)];
        return {
          id,
          role: "bot",
          text: `I checked "${target.title}". It is routed to the ${target.department} with a smart SLA of ${target.slaDays} days${
            dl.overdue
              ? ` — currently ${dl.days} day(s) overdue, so FIXORA has auto-escalated it to the ${level}`
              : ` — ${dl.days} day(s) left, still within deadline`
          }.\n\nYou can speed things up: gather citizen support — every supporter raises the priority score and pushes it up the department queue.`,
          links: [{ label: "Open the complaint", href: `/complaints/${target.id}` }],
        };
      }
      return {
        id,
        role: "bot",
        text: "You have no delayed complaints right now — everything is inside its smart SLA window. When a deadline is missed, I escalate automatically: Field Officer → Ward Supervisor → Zonal Engineer → Commissioner.",
        links: [{ label: "Track my complaints", href: "/complaints" }],
      };
    }

    if (/(department|who handles|which dept|துறை|विभाग|శాఖ|വകുപ്പ്|ಇಲಾಖೆ|বিভাগ|વિભાગ)/.test(q)) {
      const rows = CATEGORIES.slice(0, 6)
        .map((c) => `• ${c.label} → ${c.dept}`)
        .join("\n");
      return {
        id,
        role: "bot",
        text: `FIXORA AI auto-routes every report using photo + description + location signals. The mapping right now:\n\n${rows}\n\nRouting happens instantly on submission — no forms, no offices, no waiting lines.`,
        links: [{ label: "Test it with a photo", href: "/report" }],
      };
    }

    if (/(unresolved|pending|not resolved|open|தீர்க்கப்படாத|अनसुलझी|పరిష్కరించని|പരിഹരിക്കാത്ത|ಪರಿಹರಿಸದ|न सुटलेल्या|অমীমাংসিত|बિન)/.test(q)) {
      const worst = overdue.slice(0, 2);
      const list = worst
        .map((c) => `• ${c.title} — ${deadlineInfo(c).days}d overdue, escalated to ${ESCALATION_LEVELS[Math.min(3, c.escalationLevel ?? 0)]}`)
        .join("\n");
      return {
        id,
        role: "bot",
        text: `Currently ${open.length} problems are unresolved and ${overdue.length} of them crossed their smart deadline.\n\n${list || "• Good news — nothing is overdue right now."}\n\nThese are non-resolved until a citizen verifies the fix with before/after photo proof.`,
        links: [{ label: "Open Non-Resolved Problems", href: "/unresolved" }],
      };
    }

    if (/(comes back|come back|again|recurr|return|மீண்டும்|लौट|वापस|తిరిగి|മടങ്ങ|मರಳಿ|पुन्हा|ফিরে|પાછ)/.test(q)) {
      return {
        id,
        role: "bot",
        text: `If a problem returns, do NOT file a fresh report — open the resolved complaint and tap "Still Not Fixed".\n\nFIXORA then:\n1. Reopens the case and links it to the same Problem DNA\n2. Flags "Recurring Problem Detected" for Root-Cause AI\n3. Escalates it one level up automatically\n4. Schedules 7-day and 30-day rechecks after re-resolution\n\nRecurring items get permanent root-cause fixes instead of repeated patch work.`,
        links: [{ label: "See a recurring case", href: "/complaints" }],
      };
    }

    const resCount = complaints.length - open.length;
    return {
      id,
      role: "bot",
      text: `Here is your city's live pulse: ${open.length} open reports, ${resCount} resolved, ${overdue.length} escalated.\n\nYou can ask me:\n• "What problems are near me?"\n• "Why is my complaint delayed?"\n• "Which department handles this?"\n• "Show unresolved problems."\n• "What should I do if the problem comes back?"`,
      links: [
        { label: "Street Health Score", href: "/street-care" },
        { label: "AI Assistant actions", href: "/report" },
      ],
    };
  };

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    setMessages((m) => [...m, { id: idRef.current++, role: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, answer(text)]);
      setTyping(false);
    }, 1100 + Math.random() * 500);
  };

  return (
    <div className="flex h-[calc(100dvh-6rem)] flex-col">
      {/* header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-brand-600 text-white shadow-lg shadow-teal-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        </div>
        <div>
          <h1 className="font-display text-lg font-bold leading-none text-slate-900">FIXORA AI</h1>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Online · trained on your city's live registry
          </p>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto py-5">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white ${
                m.role === "bot"
                  ? "bg-gradient-to-br from-teal-600 to-brand-600"
                  : "bg-slate-300 text-slate-600"
              }`}
            >
              {m.role === "bot" ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className={`max-w-[82%] ${m.role === "user" ? "text-right" : ""}`}>
              <div
                className={`inline-block whitespace-pre-line rounded-3xl px-4 py-3 text-left text-[13.5px] font-medium leading-relaxed shadow-sm ${
                  m.role === "bot"
                    ? "rounded-tl-lg border border-slate-100 bg-white text-slate-700"
                    : "rounded-tr-lg bg-gradient-to-br from-brand-600 to-brand-500 text-white"
                }`}
              >
                {m.text}
              </div>
              {m.links && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.links.map((l) => (
                    <Link
                      key={l.href + l.label}
                      href={l.href}
                      className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700 transition hover:bg-brand-100"
                    >
                      {l.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-teal-600 to-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-lg border border-slate-100 bg-white px-4 py-3.5 shadow-sm">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2 w-2 rounded-full bg-teal-400"
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* quick chips */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3">
        {QUICK.map((key) => {
          const icons = { q1: MapPin, q2: Timer, q3: Building2, q4: TriangleAlert, q5: RotateCcw };
          const Icon = icons[key];
          return (
            <button
              key={key}
              onClick={() => send(t(key))}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-teal-200 bg-teal-50 px-3.5 py-2 text-[11.5px] font-bold text-teal-700 transition hover:bg-teal-100"
            >
              <Icon className="h-3.5 w-3.5" />
              {t(key)}
            </button>
          );
        })}
      </div>

      {/* input */}
      <div className="flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-lg shadow-brand-600/5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("askPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => send()}
          disabled={!input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-teal-500 text-white shadow-lg shadow-brand-600/30 disabled:opacity-40"
          aria-label="Send"
        >
          <SendHorizonal className="h-5 w-5" />
        </motion.button>
      </div>

      <p className="pt-2.5 text-center text-[10px] text-slate-400">
        <BadgeCheck className="mr-1 inline h-3 w-3 text-teal-500" />
        Answers are generated from the live FIXORA registry — demo assistant
      </p>
    </div>
  );
}
