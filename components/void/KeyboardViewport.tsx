"use client";

import { useEffect } from "react";
import { getKeyboardInset } from "@/lib/keyboard-viewport";

/** Syncs CSS vars when the mobile keyboard opens — drawers ride above it like Telegram. */
export function KeyboardViewport() {
  useEffect(() => {
    const root = document.documentElement;

    let meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.getAttribute("content")?.includes("interactive-widget")) {
      const content = meta.getAttribute("content") ?? "";
      meta.setAttribute("content", `${content}, interactive-widget=resizes-content`);
    }

    function apply() {
      const vv = window.visualViewport;
      if (!vv) return;

      const inset = getKeyboardInset();
      root.style.setProperty("--keyboard-inset", `${inset}px`);
      root.style.setProperty("--visual-viewport-height", `${Math.round(vv.height)}px`);
      root.style.setProperty("--visual-viewport-offset-top", `${Math.round(vv.offsetTop)}px`);

      if (inset > 40) {
        root.dataset.keyboardOpen = "";
      } else {
        delete root.dataset.keyboardOpen;
      }
    }

    apply();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("focusin", apply);
    window.addEventListener("orientationchange", apply);

    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("focusin", apply);
      window.removeEventListener("orientationchange", apply);
      delete root.dataset.keyboardOpen;
      root.style.removeProperty("--keyboard-inset");
      root.style.removeProperty("--visual-viewport-height");
      root.style.removeProperty("--visual-viewport-offset-top");
    };
  }, []);

  return null;
}
