"use client";

import { Download, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { useLocale } from "@/lib/locale";
import {
  dismissPwaPromptForSession,
  isIosDevice,
  isStandalonePwa,
  runIosInstallFlow,
  runNativeInstallPrompt,
  wasPwaPromptDismissedThisSession,
  type BeforeInstallPromptEvent
} from "@/lib/pwa-install";

export function PwaInstallPrompt() {
  const { isFa } = useLocale();
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [secure, setSecure] = useState(true);

  const ios = isIosDevice();

  useEffect(() => {
    setSecure(window.isSecureContext);
  }, []);

  useEffect(() => {
    if (isStandalonePwa() || wasPwaPromptDismissedThisSession()) return;

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setOpen(true);
    }

    function onInstalled() {
      setOpen(false);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      fallbackTimer = setTimeout(() => setOpen(true), 600);
    } else if (window.isSecureContext) {
      fallbackTimer = setTimeout(() => {
        if (!isStandalonePwa() && !installEvent) setOpen(true);
      }, 2000);
    } else {
      fallbackTimer = setTimeout(() => setOpen(true), 800);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [ios, installEvent]);

  const install = useCallback(async () => {
    setInstalling(true);
    try {
      if (installEvent) {
        const outcome = await runNativeInstallPrompt(installEvent);
        if (outcome === "accepted") setOpen(false);
        setInstallEvent(null);
        return;
      }

      if (ios) {
        await runIosInstallFlow(APP_NAME, window.location.href);
      }
    } finally {
      setInstalling(false);
    }
  }, [installEvent, ios]);

  function later() {
    dismissPwaPromptForSession();
    setOpen(false);
  }

  if (!open) return null;

  const canInstall = Boolean(installEvent) || ios;
  const needsHttps = !secure && !ios;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="void-pwa-install"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="void-pwa-install__card"
            dir={isFa ? "rtl" : "ltr"}
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className="void-pwa-install__close" onClick={later} aria-label="Close">
              <X size={20} />
            </button>

            <div className="void-pwa-install__icon-wrap">
              <img src="/icon.png" alt="" className="void-pwa-install__icon" />
            </div>

            <p className="void-pwa-install__eyebrow">{isFa ? "نصب اپ" : "Install app"}</p>
            <h2 id="pwa-install-title" className="void-pwa-install__title">
              {isFa ? `${APP_NAME} — بدون مرورگر` : `${APP_NAME} — no browser bar`}
            </h2>

            {needsHttps ? (
              <p className="void-pwa-install__text void-pwa-install__text--warn">
                <ShieldAlert size={16} style={{ verticalAlign: "middle", marginInlineEnd: 6 }} />
                {isFa
                  ? "روی HTTP نوار آدرس مرورگر همیشه نمایش داده می‌شود. برای تجربه اپلیکیشن واقعی (بدون نوار مرورگر) سایت باید HTTPS داشته باشد."
                  : "On HTTP the browser address bar always shows. For a true native app (no URL bar), the site needs HTTPS."}
              </p>
            ) : (
              <p className="void-pwa-install__text">
                {isFa
                  ? "اپ را نصب کن تا تمام‌صفحه و بدون نوار مرورگر باز شود."
                  : "Install the app to open fullscreen without the browser UI."}
              </p>
            )}

            <div className="void-pwa-install__actions">
              {canInstall && !needsHttps && (
                <button
                  type="button"
                  className="void-pwa-install__primary"
                  disabled={installing || (!installEvent && !ios)}
                  onClick={() => void install()}
                >
                  <Download size={18} />
                  {installing
                    ? isFa
                      ? "در حال نصب…"
                      : "Installing…"
                    : !installEvent && !ios
                      ? isFa
                        ? "در حال آماده‌سازی…"
                        : "Preparing…"
                      : isFa
                        ? "نصب اپلیکیشن"
                        : "Install app"}
                </button>
              )}
              <button type="button" className="void-pwa-install__later" onClick={later}>
                {isFa ? "بعداً" : "Later"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
