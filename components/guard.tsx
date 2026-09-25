"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./ui";

export default function Guard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    try {
      const profile = localStorage.getItem("fixora_profile");
      const role = localStorage.getItem("fixora_role");
      if (!profile && role !== "department") {
        router.replace("/");
        return;
      }
      setOk(true);
    } catch {
      router.replace("/");
    }
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size={52} pulse />
          <p className="text-xs font-semibold tracking-[0.3em] text-slate-400 uppercase">
            FIXORA
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
