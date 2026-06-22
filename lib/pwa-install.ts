export const PWA_LATER_KEY = "aveno-pwa-later";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isAndroidDevice() {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

export function wasPwaPromptDismissedThisSession() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(PWA_LATER_KEY) === "1";
}

export function dismissPwaPromptForSession() {
  sessionStorage.setItem(PWA_LATER_KEY, "1");
}
