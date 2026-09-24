"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Camera,
  ClipboardList,
  TriangleAlert,
  HeartPulse,
  Sparkles,
  User,
  Languages,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/constants";
import { getProfile } from "@/lib/utils";

const MENU = [
  { href: "/home", key: "navHome", icon: Home },
  { href: "/report", key: "navReport", icon: Camera },
  { href: "/complaints", key: "navComplaints", icon: ClipboardList },
  { href: "/unresolved", key: "navUnresolved", icon: TriangleAlert },
  { href: "/street-care", key: "navStreet", icon: HeartPulse },
  { href: "/assistant", key: "navAssistant", icon: Sparkles },
  { href: "/profile", key: "navProfile", icon: User },
  { href: "/language", key: "navLanguage", icon: Languages },
  { href: "/privacy", key: "navPrivacy", icon: ShieldCheck },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isDept, setIsDept] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const p = getProfile();
    setName(p?.fullName ?? (localStorage.getItem("fixora_role") === "department" ? "Ward Officer" : ""));
    setPhoto(p?.photo ?? null);
    setIsDept(localStorage.getItem("fixora_role") === "department" && !p);
  }, [pathname]);

  const langMeta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const logout = () => {
    try {
      localStorage.removeItem("fixora_profile");
      localStorage.removeItem("fixora_role");
      localStorage.removeItem("fixora_my_complaints");
    } catch {}
    router.replace("/");
  };

  return (
    <div className="min-h-dvh grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200/70">
        <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm active:scale-95 transition"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/home" className="flex items-center gap-2.5">
            <Logo size={34} />
            <div className="leading-none">
              <p className="font-display text-lg font-bold tracking-tight text-slate-900">
                FIXORA
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-600">
                Report · Track · Verify
              </p>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/language"
              className="hidden sm:flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm"
            >
              {langMeta.native}
            </Link>
            <Link
              href={isDept ? "/department" : "/profile"}
              className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-brand-500 to-teal-500 text-sm font-bold text-white shadow-sm"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="profile" className="h-full w-full object-cover" />
              ) : (
                (name || "F").charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -340 }}
              animate={{ x: 0 }}
              exit={{ x: -340 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 flex h-full w-[320px] max-w-[86vw] flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-2.5">
                  <Logo size={36} />
                  <div>
                    <p className="font-display text-lg font-bold leading-none">FIXORA</p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-teal-600">
                      Civic Intelligence
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                {MENU.map((item, i) => {
                  const active = pathname === item.href;
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 * i }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                          active
                            ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-lg shadow-brand-600/25"
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        <item.icon className={cn("h-4.5 w-4.5", active ? "text-white" : "text-slate-400")} />
                        {t(item.key)}
                        {item.key === "navAssistant" && !active && (
                          <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-600 border border-teal-200">
                            AI
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
                {isDept && (
                  <Link
                    href="/department"
                    className={cn(
                      "mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                      pathname === "/department"
                        ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Building2 className="h-4.5 w-4.5 text-slate-400" />
                    Department
                  </Link>
                )}
              </nav>
              <div className="border-t border-slate-100 p-3">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  {t("navLogout")}
                </button>
                <p className="px-4 pt-2 text-[10px] text-slate-400">
                  FXR v1.0 · Civic Intelligence Platform
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Page body */}
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6">{children}</main>

      {/* Floating AI Assistant */}
      {pathname !== "/assistant" && (
        <Link href="/assistant" aria-label="AI Assistant">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 14, delay: 0.4 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-6 right-5 z-40"
          >
            <div className="relative grid h-15 w-15 place-items-center rounded-full p-4 text-white shadow-2xl shadow-teal-600/40"
              style={{ background: "linear-gradient(135deg,#0d9488,#1d64f0)" }}
            >
              <span className="absolute inset-0 rounded-full bg-teal-500/50 animate-pulse-ring" />
              <Sparkles className="relative h-6 w-6" />
              <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-rose-500 text-[9px] font-black">
                AI
              </span>
            </div>
          </motion.div>
        </Link>
      )}
    </div>
  );
}
