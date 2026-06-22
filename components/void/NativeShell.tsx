"use client";

import { useEffect } from "react";
import { isStandalonePwa } from "@/lib/pwa-install";
import { registerServiceWorker } from "@/app/sw-register";

/** Marks installed PWA mode on <html> for native fullscreen styling. */
export function NativeShell() {
  useEffect(() => {
    registerServiceWorker();

    const root = document.documentElement;

    function apply() {
      const standalone = isStandalonePwa();
      if (standalone) {
        root.dataset.avenoStandalone = "";
        root.dataset.avenoPwa = "";
      } else {
        delete root.dataset.avenoStandalone;
        delete root.dataset.avenoPwa;
      }
    }

    apply();

    const modes = ["standalone", "fullscreen", "minimal-ui"] as const;
    const listeners = modes.map((mode) => {
      const mq = window.matchMedia(`(display-mode: ${mode})`);
      mq.addEventListener("change", apply);
      return mq;
    });

    // iOS legacy
    const nav = window.navigator as Navigator & { standalone?: boolean };
    if (nav.standalone) apply();

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
      listeners.forEach((mq) => mq.removeEventListener("change", apply));
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      delete root.dataset.avenoStandalone;
      delete root.dataset.avenoPwa;
    };
  }, []);

  return null;
}
