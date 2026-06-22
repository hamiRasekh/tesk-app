"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, CheckCircle2, ChevronRight, Clock, LogOut, Settings, Shield, User } from "lucide-react";
import { AppHeader } from "@/components/void/AppHeader";
import { VoidSpirit } from "@/components/void/VoidSpirit";
import { clearToken } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { Drawer } from "@/components/void/Drawer";
import { useVoid } from "@/lib/void-store";
import { hoursFromMinutes } from "@/lib/void-utils";

export default function ProfilePage() {
  const { state, updateProfile } = useVoid();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [title, setTitle] = useState(state.profile.title);
  const [email, setEmail] = useState(state.profile.email);

  const xpPercent = Math.round((state.profile.xp / state.profile.xpToNext) * 100);

  function saveProfile() {
    void updateProfile({ name: name.trim(), title: title.trim(), email: email.trim(), rank: title.trim() }).then(
      () => setEditOpen(false)
    );
  }

  return (
    <div className="void-shell">
      <header className="void-topbar">
        <div className="void-topbar__brand">
          <img src="/logo.png" alt={APP_NAME} className="void-topbar__logo" />
          <span className="void-topbar__name">{APP_NAME}</span>
        </div>
        <button type="button" className="void-topbar__notify" aria-label="Notifications">
          <Bell size={20} />
        </button>
      </header>

      <motion.div
        className="void-profile-spirit void-spirit-slot void-spirit-slot--profile"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <VoidSpirit variant="happy" scale="lg" showcase glow />
      </motion.div>

      <h2 className="void-profile-name">{state.profile.name}</h2>
      <p className="void-profile-rank">{state.profile.rank}</p>

      <motion.div className="void-level-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <div className="void-level-card__label">Aveno Level</div>
        <div className="void-level-card__row">
          <span className="void-level-card__level">Level {state.profile.level}</span>
          <span className="void-level-card__xp">
            {state.profile.xp.toLocaleString()} / {state.profile.xpToNext.toLocaleString()} XP
          </span>
        </div>
        <div className="void-stat__bar">
          <div className="void-stat__bar-fill void-stat__bar-fill--cyan" style={{ width: `${xpPercent}%` }} />
        </div>
      </motion.div>

      <div className="void-mini-grid">
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="void-stat-card__icon">
            <Clock size={18} />
          </div>
          <div>
            <div className="void-stat-card__value">{hoursFromMinutes(state.profile.totalFocusMinutes)}</div>
            <div className="void-stat-card__label">Deep Focus</div>
          </div>
        </motion.div>
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
          <div className="void-stat-card__icon">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="void-stat-card__value">{state.profile.completedTasks}</div>
            <div className="void-stat-card__label">Completed</div>
          </div>
        </motion.div>
      </div>

      <p className="void-section-title" style={{ marginTop: 8 }}>
        System Configuration
      </p>

      <button type="button" className="void-menu-item" onClick={() => setEditOpen(true)}>
        <span className="void-menu-item__icon">
          <User size={18} />
        </span>
        Edit Profile
        <ChevronRight size={18} className="void-menu-item__chevron" />
      </button>
      <button type="button" className="void-menu-item">
        <span className="void-menu-item__icon">
          <Shield size={18} />
        </span>
        Security & Privacy
        <ChevronRight size={18} className="void-menu-item__chevron" />
      </button>
      <button type="button" className="void-menu-item">
        <span className="void-menu-item__icon">
          <Settings size={18} />
        </span>
        App Settings
        <ChevronRight size={18} className="void-menu-item__chevron" />
      </button>
      <a
        href="/login"
        className="void-menu-item void-menu-item--danger"
        style={{ textDecoration: "none" }}
        onClick={() => clearToken()}
      >
        <span className="void-menu-item__icon">
          <LogOut size={18} />
        </span>
        Log out
        <ChevronRight size={18} className="void-menu-item__chevron" />
      </a>

      <Drawer open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="void-drawer__body">
          <h2 className="void-drawer__title void-drawer__title--lg">Edit Profile</h2>
          <label className="void-label">Display name</label>
          <input className="void-input void-input--pill" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="void-label">Title</label>
          <input className="void-input void-input--pill" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="void-label">Email</label>
          <input className="void-input void-input--pill" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="void-drawer__footer-cta">
          <button type="button" className="void-btn void-btn--initiate" onClick={saveProfile}>
            Save changes
          </button>
        </div>
      </Drawer>
    </div>
  );
}
