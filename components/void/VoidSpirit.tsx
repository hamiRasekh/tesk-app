"use client";

import { motion } from "framer-motion";
import type { SpiritMood, SpiritVariant } from "@/lib/void-types";

const SRC: Record<SpiritVariant, string> = {
  normal: "/normal-1.png",
  hello: "/hello.png",
  work: "/work.png",
  happy: "/happy.png"
};

const MOOD_VARIANT: Record<SpiritMood, SpiritVariant> = {
  idle: "normal",
  focused: "work",
  happy: "happy",
  writing: "work",
  reminder: "normal"
};

export type SpiritSize = "sm" | "md" | "lg" | "xl";

type Props = {
  mood?: SpiritMood;
  variant?: SpiritVariant;
  /** @deprecated prefer `scale` for responsive layouts */
  size?: number;
  scale?: SpiritSize;
  className?: string;
  glow?: boolean;
  showcase?: boolean;
};

export function VoidSpirit({
  mood = "idle",
  variant,
  size,
  scale = "md",
  className = "",
  glow = true,
  showcase = false
}: Props) {
  const src = SRC[variant ?? MOOD_VARIANT[mood]];
  const isWork = (variant ?? MOOD_VARIANT[mood]) === "work";
  const sizeClass = size ? "" : `void-spirit--${scale}`;

  return (
    <motion.div
      className={`void-spirit ${sizeClass} ${showcase ? "void-spirit--showcase" : ""} ${isWork ? "void-spirit--work-mode" : "void-spirit--float"} ${className}`}
      style={size ? { width: size, height: size * 1.15 } : undefined}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {glow && (
        <>
          <div className="void-spirit__aura" aria-hidden="true" />
          <div className="void-spirit__ring" aria-hidden="true" />
          <span className="void-spirit__spark void-spirit__spark--1" aria-hidden="true" />
          <span className="void-spirit__spark void-spirit__spark--2" aria-hidden="true" />
          <span className="void-spirit__spark void-spirit__spark--3" aria-hidden="true" />
        </>
      )}
      <motion.img
        alt="Void Spirit companion"
        className="void-spirit__img"
        src={src}
        draggable={false}
        animate={
          showcase
            ? { y: [0, -10, 0] }
            : isWork
              ? { y: [0, -5, 0], scale: [1, 1.02, 1] }
              : { y: [0, -8, 0] }
        }
        transition={{
          duration: isWork ? 1.4 : showcase ? 3.8 : 3.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}
