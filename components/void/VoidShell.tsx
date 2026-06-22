"use client";

import { FocusTimerLayer } from "./FocusTimerLayer";
import { BottomNav } from "./BottomNav";
import { AuthGuard } from "./AuthGuard";
import { RegisterSw } from "./RegisterSw";
import { VoidProvider } from "@/lib/void-store";
import { VoidNoticeProvider } from "@/lib/void-notice";

export function VoidShell({ children }: { children: React.ReactNode }) {
  return (
    <VoidNoticeProvider>
      <VoidProvider>
        <RegisterSw />
        <div className="void-app">
          <div className="void-app__bg" aria-hidden="true">
            <div className="void-app__orb void-app__orb--a" />
            <div className="void-app__orb void-app__orb--b" />
          </div>
          <AuthGuard>{children}</AuthGuard>
          <FocusTimerLayer />
          <BottomNav />
        </div>
      </VoidProvider>
    </VoidNoticeProvider>
  );
}
