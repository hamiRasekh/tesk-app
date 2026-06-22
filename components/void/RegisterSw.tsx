"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/app/sw-register";

export function RegisterSw() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
