"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getToken } from "@/lib/api";
import { clearCachedState } from "@/lib/offline-cache";
import { clearQueue } from "@/lib/offline-queue";
import { useVoid } from "@/lib/void-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, synced } = useVoid();

  useEffect(() => {
    if (loading) return;
    if (!getToken()) {
      router.replace("/login");
    }
  }, [loading, router]);

  if (loading) {
    return (
      <div className="void-auth-loading">
        <div className="void-auth-loading__orb" />
        <p>Loading your data…</p>
      </div>
    );
  }

  if (!synced) {
    return null;
  }

  return <>{children}</>;
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearToken();
    clearCachedState();
    clearQueue();
    router.replace("/login");
  };
}
