"use client";

import { BottomNav } from "./BottomNav";
import { VoidProvider } from "@/lib/void-store";

export function VoidShell({ children }: { children: React.ReactNode }) {
  return (
    <VoidProvider>
      <div className="void-app">
        <div className="void-app__bg" aria-hidden="true">
          <div className="void-app__orb void-app__orb--a" />
          <div className="void-app__orb void-app__orb--b" />
        </div>
        {children}
        <BottomNav />
      </div>
    </VoidProvider>
  );
}
