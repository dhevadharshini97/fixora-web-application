"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ArrowRight, Clipboard, Info } from "lucide-react";
import { Btn } from "@/components/ui";

function normalizeId(value: string) {
  const cleaned = value.trim().toUpperCase();
  const match = cleaned.match(/(?:FX-?)?(\d+)/);
  return match ? match[1] : cleaned;
}

export default function OrderTrackPage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = normalizeId(trackingId);

    if (!id) {
      setError("Enter your FIXORA complaint ID.");
      return;
    }

    if (!/^\d+$/.test(id)) {
      setError("Use a valid ID such as FX-00001.");
      return;
    }

    router.push("/complaints/" + id);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-brand-700 via-brand-600 to-teal-600 p-7 text-white shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
          <Clipboard className="h-6 w-6" />
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.28em] text-teal-200">
          FIXORA · LIVE TRACKING
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Track your complaint
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100">
          Enter your complaint ID to view department assignment, current status,
          SLA deadline, escalation and the complete resolution timeline.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold text-slate-800">
            Complaint ID
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Example: FX-00001"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10"
                aria-label="Complaint ID"
              />
            </div>
          </label>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Btn variant="primary" full className="py-4" type="submit">
            Track complaint
            <ArrowRight className="h-4 w-4" />
          </Btn>
        </form>

        <div className="mt-5 flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-xs leading-5 text-slate-500">
            Your complaint ID is shown after submission and on the complaint
            card. You can enter it with or without the <b>FX-</b> prefix.
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["01", "Submitted", "Report received"],
          ["02", "Assigned", "Department handling"],
          ["03", "Resolved", "Citizen verifies"],
        ].map(([n, title, desc]) => (
          <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-[10px] font-black text-brand-600">{n}</span>
            <p className="mt-2 text-sm font-bold text-slate-800">{title}</p>
            <p className="mt-1 text-[11px] text-slate-500">{desc}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
        Live status refreshes automatically on the complaint page
      </div>
    </div>
  );
}
