"use client";

import { motion } from "framer-motion";
import { VoidSpirit } from "./VoidSpirit";
import type { SpiritMood } from "@/lib/void-types";

type Props = {
  done: number;
  total: number;
  mood?: SpiritMood;
  quote?: string;
};

export function ActiveFocusCard({ done, total, mood = "idle", quote }: Props) {
  const progress = total ? (done / total) * 100 : 0;

  return (
    <motion.div
      className="void-active-focus"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="void-active-focus__spirit void-spirit-slot void-spirit-slot--card">
        <VoidSpirit
          variant={mood === "focused" ? "work" : "normal"}
          mood={mood}
          scale="sm"
          showcase
          glow
        />
      </div>
      <div className="void-active-focus__content">
        <p className="void-active-focus__label">Active Focus</p>
        <p className="void-active-focus__quote">
          {quote ?? "Discipline is the bridge to mastery."}
        </p>
        <div className="void-stat__bar void-active-focus__bar">
          <motion.div
            className="void-stat__bar-fill void-stat__bar-fill--cyan"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="void-active-focus__progress">
          {done}/{total} Completed
        </p>
      </div>
    </motion.div>
  );
}
