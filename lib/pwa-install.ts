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

export function isChromiumInstallable() {
  if (typeof window === "undefined") return false;
  return !isIosDevice() && "onbeforeinstallprompt" in window;
}

export function canUseNativeInstallPrompt() {
  return typeof window !== "undefined" && window.isSecureContext && isChromiumInstallable();
}

export function wasPwaPromptDismissedThisSession() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(PWA_LATER_KEY) === "1";
}

export function dismissPwaPromptForSession() {
  sessionStorage.setItem(PWA_LATER_KEY, "1");
}

/** Android / Chrome — triggers the browser install sheet. */
export async function runNativeInstallPrompt(event: BeforeInstallPromptEvent) {
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

/**
 * iOS has no install API. Share sheet is the closest one-tap path
 * (user picks "Add to Home Screen" in the sheet).
 */
export async function runIosInstallFlow(title: string, url: string) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share({ title, url });
    return true;
  } catch {
    return false;
  }
}
