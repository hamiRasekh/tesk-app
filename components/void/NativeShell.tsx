"use client";

import { useEffect } from "react";
import { isStandalonePwa } from "@/lib/pwa-install";

/** Marks installed PWA mode on <html> for native fullscreen styling. */
export function NativeShell() {
  useEffect(() => {
    const root = document.documentElement;

    function apply() {
      if (isStandalonePwa()) {
        root.dataset.avenoStandalone = "";
      } else {
        delete root.dataset.avenoStandalone;
      }
    }

    apply();

    const mq = window.matchMedia("(display-mode: standalone)");
    const mqFull = window.matchMedia("(display-mode: fullscreen)");
    mq.addEventListener("change", apply);
    mqFull.addEventListener("change", apply);

    // Block pull-to-refresh / rubber-band in installed app
    let startY = 0;
    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(e: TouchEvent) {
      if (!isStandalonePwa()) return;
      const el = document.scrollingElement ?? document.documentElement;
      const atTop = el.scrollTop <= 0;
      const y = e.touches[0]?.clientY ?? 0;
      if (atTop && y > startY) e.preventDefault();
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      mq.removeEventListener("change", apply);
      mqFull.removeEventListener("change", apply);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      delete root.dataset.avenoStandalone;
    };
  }, []);

  return null;
}
