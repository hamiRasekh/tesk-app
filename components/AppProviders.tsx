"use client";

import { LocaleProvider } from "@/lib/locale";
import { KeyboardViewport } from "@/components/void/KeyboardViewport";
import { NativeShell } from "@/components/void/NativeShell";
import { PwaInstallPrompt } from "@/components/void/PwaInstallPrompt";
import "../app/pwa-install.css";
import "../app/keyboard-viewport.css";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <KeyboardViewport />
      <NativeShell />
      <PwaInstallPrompt />
      {children}
    </LocaleProvider>
  );
}
