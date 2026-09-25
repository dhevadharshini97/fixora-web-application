import type { ReactNode } from "react";
import Guard from "@/components/guard";
import AppShell from "@/components/app-shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <Guard>
      <AppShell>{children}</AppShell>
    </Guard>
  );
}
