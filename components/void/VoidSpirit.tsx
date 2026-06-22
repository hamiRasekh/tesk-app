"use client";

import { motion } from "framer-motion";
import type { SpiritMood, SpiritVariant } from "@/lib/void-types";

const SRC: Record<SpiritVariant, string> = {
  normal: "/normal-1.png",
  hello: "/hello.png",
  work: "/work.png",
  happy: "/happy.png",
  write: "/write.png",
  think: "/think.png"
};

const MOOD_VARIANT: Record<SpiritMood, SpiritVariant> = {
  idle: "normal",
  focused: "work",
  happy: "happy",
  writing: "write",
  reminder: "think"
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

function spiritMotion(variant: SpiritVariant, showcase: boolean) {
  if (variant === "think") {
    return showcase
      ? { y: [0, -8, 0], rotate: [0, -2, 2, 0] }
      : { y: [0, -6, 0], rotate: [0, -1.5, 1.5, 0] };
  }
  if (variant === "write") {
    return showcase
      ? { y: [0, -6, -2, -6, 0], x: [0, 1, -1, 0] }
      : { y: [0, -4, 0], x: [0, 1, 0] };
  }
  if (variant === "work") {
    return { y: [0, -5, 0], scale: [1, 1.02, 1] };
  }
  if (showcase) {
    return { y: [0, -10, 0] };
  }
  return { y: [0, -8, 0] };
}

function spiritDuration(variant: SpiritVariant, showcase: boolean) {
  if (variant === "think") return showcase ? 4.2 : 3.6;
  if (variant === "write") return showcase ? 2.8 : 2.2;
  if (variant === "work") return 1.4;
  return showcase ? 3.8 : 3.2;
}

export function VoidSpirit({
  mood = "idle",
  variant,
  size,
  scale = "md",
  className = "",
  glow = true,
  showcase = false
}: Props) {
  const resolved = variant ?? MOOD_VARIANT[mood];
  const src = SRC[resolved];
  const isWork = resolved === "work";
  const isThink = resolved === "think";
  const isWrite = resolved === "write";
  const sizeClass = size ? "" : `void-spirit--${scale}`;
  const modeClass = isWork
    ? "void-spirit--work-mode"
    : isThink
      ? "void-spirit--think-mode"
      : isWrite
        ? "void-spirit--write-mode"
        : "void-spirit--float";

  return (
    <motion.div
      className={`void-spirit ${sizeClass} ${showcase ? "void-spirit--showcase" : ""} ${modeClass} ${className}`}
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
        alt="Aveno companion"
        className="void-spirit__img"
        src={src}
        draggable={false}
        animate={spiritMotion(resolved, showcase)}
        transition={{
          duration: spiritDuration(resolved, showcase),
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}
