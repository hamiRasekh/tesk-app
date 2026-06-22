"use client";

import { Download, Share2, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { APP_NAME } from "@/lib/brand";
import { useLocale } from "@/lib/locale";
import {
  dismissPwaPromptForSession,
  isAndroidDevice,
  isIosDevice,
  isStandalonePwa,
  wasPwaPromptDismissedThisSession,
  type BeforeInstallPromptEvent
} from "@/lib/pwa-install";
import { registerServiceWorker } from "@/app/sw-register";

export function PwaInstallPrompt() {
  const { isFa } = useLocale();
  const [open, setOpen] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const ios = isIosDevice();
  const android = isAndroidDevice();

  useEffect(() => {
    registerServiceWorker();

    if (isStandalonePwa() || wasPwaPromptDismissedThisSession()) return;

    setOpen(true);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setOpen(false);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    setInstalling(true);
    try {
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      if (outcome === "accepted") setOpen(false);
      setInstallEvent(null);
    } finally {
      setInstalling(false);
    }
  }, [installEvent]);

  function later() {
    dismissPwaPromptForSession();
    setOpen(false);
  }

  if (!open) return null;

  const canNativeInstall = Boolean(installEvent);

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
              <span className="void-pwa-install__badge">
                <Smartphone size={14} />
              </span>
            </div>

            <p className="void-pwa-install__eyebrow">{isFa ? "نصب سریع" : "Install now"}</p>
            <h2 id="pwa-install-title" className="void-pwa-install__title">
              {isFa ? `اپلیکیشن ${APP_NAME} را نصب کن` : `Install the ${APP_NAME} app`}
            </h2>
            <p className="void-pwa-install__text">
              {isFa
                ? "برای تجربه بهتر، اعلان فوکوس و دسترسی آفلاین، همین الان اپ را روی گوشی نصب کن."
                : "For the best experience, focus alerts, and offline access — add Aveno to your home screen now."}
            </p>

            {ios && (
              <ol className="void-pwa-install__steps">
                <li>
                  <Share2 size={16} />
                  <span>
                    {isFa
                      ? "دکمه Share (اشتراک‌گذاری) را در Safari بزن"
                      : "Tap Share in Safari (bottom bar)"}
                  </span>
                </li>
                <li>
                  <Download size={16} />
                  <span>
                    {isFa ? "گزینه «Add to Home Screen» را انتخاب کن" : "Choose Add to Home Screen"}
                  </span>
                </li>
                <li>
                  <Smartphone size={16} />
                  <span>{isFa ? "Add را بزن — تمام!" : "Tap Add — you're done!"}</span>
                </li>
              </ol>
            )}

            {!ios && !canNativeInstall && (
              <p className="void-pwa-install__hint">
                {android
                  ? isFa
                    ? "منوی مرورگر (⋮) → Install app یا Add to Home screen"
                    : "Browser menu (⋮) → Install app or Add to Home screen"
                  : isFa
                    ? "از منوی مرورگر گزینه Install / Add to Home Screen را بزن"
                    : "Use your browser menu: Install or Add to Home Screen"}
              </p>
            )}

            <div className="void-pwa-install__actions">
              {canNativeInstall && (
                <button
                  type="button"
                  className="void-pwa-install__primary"
                  disabled={installing}
                  onClick={() => void install()}
                >
                  <Download size={18} />
                  {installing
                    ? isFa
                      ? "در حال نصب…"
                      : "Installing…"
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
