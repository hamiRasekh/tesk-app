"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, getToken, isOfflineError, purgeLegacyDemoStorage, setToken } from "@/lib/api";
import { loadCachedState } from "@/lib/offline-cache";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { VoidSpirit } from "@/components/void/VoidSpirit";
import { registerServiceWorker } from "../sw-register";

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  delay: `${(i * 0.7) % 12}s`,
  duration: `${8 + (i % 6) * 2}s`,
  size: i % 3 === 0 ? 3 : 2
}));

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }
  })
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    purgeLegacyDemoStorage();
    registerServiceWorker();
    if (getToken() && loadCachedState()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const isValid = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  async function login() {
    if (!isValid) return;
    setError("");
    setLoading(true);
    try {
      const res = await apiLogin(email, password);
      setToken(res.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      if (isOfflineError(err)) {
        setError("You are offline. Connect to the internet to sign in.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed. Check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="void-bg-layer" aria-hidden="true">
        <div className="void-orb void-orb--primary" />
        <div className="void-orb void-orb--secondary" />
        <div className="void-gradient-overlay" />
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="void-particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size
            }}
          />
        ))}
      </div>

      <main className="void-login">
        <motion.div
          className="void-login__container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="void-spirit-stage void-spirit-slot void-spirit-slot--login"
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <VoidSpirit variant="hello" scale="lg" showcase glow />
            <div className="void-spirit-pedestal" />
          </motion.div>

          <motion.h1 className="void-heading" custom={1} variants={fadeUp} initial="hidden" animate="visible">
            Welcome to {APP_NAME}
          </motion.h1>
          <motion.p className="void-tagline" custom={2} variants={fadeUp} initial="hidden" animate="visible">
            {APP_TAGLINE}
          </motion.p>

          <motion.div className="void-form" custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="void-input-wrap">
              <Mail className="void-input-icon" size={22} strokeWidth={2} />
              <input
                className="void-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="void-input-wrap">
              <Lock className="void-input-icon" size={22} strokeWidth={2} />
              <input
                className="void-input"
                type="password"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isValid && !loading) void login();
                }}
                autoComplete="current-password"
              />
            </div>

            {error ? <p className="void-form-error">{error}</p> : null}

            <motion.button
              className="void-cta"
              disabled={!isValid || loading}
              onClick={() => void login()}
              whileHover={isValid && !loading ? { scale: 1.01 } : undefined}
              animate={
                isValid && !loading
                  ? {
                      boxShadow: [
                        "0 0 20px rgba(207, 189, 255, 0.3)",
                        "0 0 32px rgba(207, 189, 255, 0.55)",
                        "0 0 20px rgba(207, 189, 255, 0.3)"
                      ]
                    }
                  : undefined
              }
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="void-cta__shine" />
              <span className="void-cta__label">{loading ? "Entering..." : "Start Journey"}</span>
            </motion.button>
          </motion.div>

          <motion.footer
            className="void-footer"
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <Link className="void-signup-link" href="/signup">
              New to {APP_NAME}? <strong>Create account</strong>
              <ChevronRight size={18} strokeWidth={2.5} />
            </Link>
          </motion.footer>
        </motion.div>
      </main>
    </>
  );
}
