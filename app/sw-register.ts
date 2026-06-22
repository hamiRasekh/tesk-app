"use client";

let registered = false;

export function registerServiceWorker() {
  if (registered || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  registered = true;
  void navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
