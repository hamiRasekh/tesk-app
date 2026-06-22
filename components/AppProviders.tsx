"use client";

import { LocaleProvider } from "@/lib/locale";
import { NativeShell } from "@/components/void/NativeShell";
import { PwaInstallPrompt } from "@/components/void/PwaInstallPrompt";
import "../app/pwa-install.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <NativeShell />
      <PwaInstallPrompt />
      {children}
    </LocaleProvider>
  );
}
