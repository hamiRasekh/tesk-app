"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isAppOnline } from "./api";
import { useLocale } from "./locale";
import { offlineMsg } from "./offline-messages";

export type NoticeKind = "offline" | "info" | "success" | "error";

type Notice = {
  id: number;
  kind: NoticeKind;
  message: string;
};

type NoticeContextValue = {
  online: boolean;
  pendingSync: number;
  notify: (message: string, kind?: NoticeKind) => void;
  setPendingSync: (n: number) => void;
};

const NoticeContext = createContext<NoticeContextValue | null>(null);

export function VoidNoticeProvider({ children }: { children: ReactNode }) {
  const { isFa } = useLocale();
  const msgs = offlineMsg(isFa ? "fa" : "en");
  const [online, setOnline] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [pendingSync, setPendingSync] = useState(0);

  const notify = useCallback((message: string, kind: NoticeKind = "info") => {
    const id = Date.now() + Math.random();
    setNotices((prev) => [...prev.slice(-2), { id, kind, message }]);
    window.setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    setOnline(isAppOnline());

    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
      notify(msgs.toast, "offline");
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [msgs.toast, notify]);

  const value = useMemo(
    () => ({ online, pendingSync, notify, setPendingSync }),
    [online, pendingSync, notify]
  );

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {!online && (
          <motion.div
            key="offline-bar"
            className="void-offline-bar"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <span className="void-offline-bar__dot" />
            {pendingSync > 0 ? msgs.barPending(pendingSync) : msgs.bar}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="void-notice-stack" aria-live="polite">
        <AnimatePresence>
          {notices.map((n) => (
            <motion.div
              key={n.id}
              className={`void-notice void-notice--${n.kind}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
            >
              {n.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NoticeContext.Provider>
  );
}

export function useVoidNotice() {
  const ctx = useContext(NoticeContext);
  if (!ctx) throw new Error("useVoidNotice must be used within VoidNoticeProvider");
  return ctx;
}
