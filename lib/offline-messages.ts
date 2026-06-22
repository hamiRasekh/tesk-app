export const offlineMessages = {
  en: {
    bar: "No internet — viewing saved data on this device",
    barPending: (n: number) =>
      `No internet — ${n} change${n > 1 ? "s" : ""} waiting to sync`,
    toast: "You are offline. Your saved data is still available.",
    showingCache: "You are offline. Showing your last saved data.",
    noCache: "You are offline. Connect once while online to load your data.",
    serverUnreachable: "Could not reach server. Using data saved on this device.",
    connectionLost: "Connection lost. You can still browse saved tasks.",
    backOnline: "Back online — everything is synced.",
    syncFailed: "Sync failed. Your changes are still saved locally."
  },
  fa: {
    bar: "اینترنت قطع است — داده‌های ذخیره‌شده روی دستگاه",
    barPending: (n: number) => `اینترنت قطع است — ${n} تغییر در انتظار همگام‌سازی`,
    toast: "اینترنت قطع است. داده‌های ذخیره‌شده هنوز در دسترس هستند.",
    showingCache: "اینترنت قطع است. آخرین داده‌های ذخیره‌شده نمایش داده می‌شود.",
    noCache: "اینترنت قطع است. یک بار آنلاین شوید تا داده‌ها بارگذاری شوند.",
    serverUnreachable: "ارتباط با سرور برقرار نشد. از داده‌های ذخیره‌شده استفاده می‌شود.",
    connectionLost: "اتصال قطع شد. همچنان می‌توانید تسک‌های ذخیره‌شده را ببینید.",
    backOnline: "آنلاین شدید — همه‌چیز همگام شد.",
    syncFailed: "همگام‌سازی نشد. تغییرات شما روی دستگاه ذخیره مانده‌اند."
  }
} as const;

export type OfflineLocale = keyof typeof offlineMessages;

export function offlineMsg(locale: OfflineLocale = "en") {
  return offlineMessages[locale] ?? offlineMessages.en;
}
