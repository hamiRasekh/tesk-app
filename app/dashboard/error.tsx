"use client";

import { isAppOnline } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { offlineMsg } from "@/lib/offline-messages";

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { isFa } = useLocale();
  const msgs = offlineMsg(isFa ? "fa" : "en");
  const offline = !isAppOnline() || error.message.toLowerCase().includes("fetch");

  if (offline) {
    return (
      <div className="void-offline-fallback">
        <img src="/icon.png" alt="" className="void-offline-fallback__icon" />
        <h2>{isFa ? "اینترنت قطع است" : "No internet connection"}</h2>
        <p>{msgs.showingCache}</p>
        <button type="button" className="void-offline-fallback__btn" onClick={() => (window.location.href = "/dashboard")}>
          {isFa ? "ادامه با داده‌های ذخیره‌شده" : "Continue with saved data"}
        </button>
      </div>
    );
  }

  return (
    <div className="void-offline-fallback">
      <h2>{isFa ? "مشکلی پیش آمد" : "Something went wrong"}</h2>
      <p>{error.message}</p>
      <button type="button" className="void-offline-fallback__btn" onClick={reset}>
        {isFa ? "تلاش دوباره" : "Try again"}
      </button>
    </div>
  );
}
