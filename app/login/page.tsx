"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { apiLogin, setToken } from "@/lib/api";
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
  const [email, setEmail] = useState("");

  useEffect(() => {
    registerServiceWorker();
  }, []);

  async function login() {
    try {
      const res = await apiLogin(email);
      setToken(res.access_token);
    } catch {
      // offline demo fallback
    }
    window.location.href = "/dashboard";
  }

  const isValid = /\S+@\S+\.\S+/.test(email);

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
          {/* Spirit character */}
          <motion.div
            className="void-spirit-stage void-spirit-slot void-spirit-slot--login"
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
          >
            <VoidSpirit variant="hello" scale="xl" showcase glow />
            <div className="void-spirit-pedestal" />
          </motion.div>

          <motion.h1 className="void-heading" custom={1} variants={fadeUp} initial="hidden" animate="visible">
            Welcome to the Void
          </motion.h1>
          <motion.p className="void-tagline" custom={2} variants={fadeUp} initial="hidden" animate="visible">
            Master your tasks, conquer your spirit.
          </motion.p>

          <motion.div className="void-form" custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <div className="void-input-wrap">
              <Mail className="void-input-icon" size={20} />
              <input
                className="void-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isValid) login();
                }}
                autoComplete="email"
              />
            </div>

            <motion.button
              className="void-cta"
              disabled={!isValid}
              onClick={login}
              whileHover={isValid ? { scale: 1.01 } : undefined}
              animate={
                isValid
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
              <span className="void-cta__label">Start Journey</span>
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
              New across the void? <strong>Summon Account</strong>
              <ChevronRight size={16} />
            </Link>
            <p className="void-legal">By entering, you accept the Cosmic Laws</p>
          </motion.footer>
        </motion.div>
      </main>

      <motion.aside
        className="void-corner-widget"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 0.2, x: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        whileHover={{ opacity: 1 }}
      >
        <div className="void-corner-widget__panel">
          <div className="void-corner-widget__ring">
            <div className="void-corner-widget__inner">
              <Sparkles size={20} />
            </div>
          </div>
          <div>
            <p className="void-corner-widget__title">AI Synthesis Active</p>
            <p className="void-corner-widget__sub">NEURAL ENGINE LOADED</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
