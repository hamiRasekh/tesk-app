import { APP_NAME } from "./brand";

export async function requestFocusNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function postToSw(payload: Record<string, unknown>) {
  if (typeof navigator === "undefined") return;
  navigator.serviceWorker?.ready
    .then((reg) => {
      reg.active?.postMessage(payload);
    })
    .catch(() => {});
}

export function notifyFocusSessionStarted(taskTitle: string) {
  const title = `${APP_NAME} — Focus active`;
  const body = `You're timing on: ${taskTitle}`;
  postToSw({ type: "FOCUS_ACTIVE", title, body, tag: "aveno-focus-active" });
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
      tag: "aveno-focus-active",
      silent: true
    });
  } catch {
    /* iOS / unsupported */
  }
}

export function notifyEstimateReached(taskTitle: string, estimatedMinutes: number) {
  const title = "Estimated time reached";
  const body = `Still working on "${taskTitle}"? You planned ${estimatedMinutes} min.`;
  postToSw({ type: "FOCUS_ESTIMATE", title, body, tag: "aveno-focus-estimate" });
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/icon.png",
      badge: "/icon.png",
      tag: "aveno-focus-estimate",
      requireInteraction: true
    });
  } catch {
    /* unsupported */
  }
}

export function clearFocusNotifications() {
  postToSw({ type: "FOCUS_CLEAR" });
}
