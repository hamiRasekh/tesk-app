"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, CheckCircle2, ChevronRight, Clock, LogOut, Settings, Shield, User } from "lucide-react";
import { AppHeader } from "@/components/void/AppHeader";
import { VoidSpirit } from "@/components/void/VoidSpirit";
import { clearToken } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";
import { Drawer } from "@/components/void/Drawer";
import { VoidInput } from "@/components/void/VoidInput";
import { useVoid } from "@/lib/void-store";
import { useLocale, type AppLocale, type CalendarSystem } from "@/lib/locale";
import { hoursFromMinutes } from "@/lib/void-utils";
import { xpProgressPercent } from "@/lib/xp";

export default function ProfilePage() {
  const { state, updateProfile } = useVoid();
  const { locale, calendar, setLocale, setCalendar, isFa } = useLocale();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [email, setEmail] = useState(state.profile.email);

  const xpPercent = xpProgressPercent(state.profile.xp, state.profile.xpToNext);

  function saveProfile() {
    void updateProfile({ name: name.trim(), email: email.trim() }).then(() => setEditOpen(false));
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
      <p className="void-profile-rank">{state.profile.title}</p>
      <p className="void-form-hint" style={{ textAlign: "center", marginTop: -4 }}>
        {state.profile.rank}
      </p>

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
        <motion.div className="void-stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="void-stat-card__icon">🔥</div>
          <div>
            <div className="void-stat-card__value">{state.profile.streak}</div>
            <div className="void-stat-card__label">{isFa ? "روز متوالی" : "Day streak"}</div>
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
        {isFa ? "تنظیمات" : "System Configuration"}
      </p>

      <div className="void-locale-card void-card" style={{ padding: "14px", marginBottom: 10 }}>
        <p className="void-label" style={{ marginBottom: 8 }}>
          {isFa ? "زبان" : "Language"}
        </p>
        <div className="void-filter-chips">
          {(["en", "fa"] as AppLocale[]).map((l) => (
            <button
              key={l}
              type="button"
              className={`void-filter-chip${locale === l ? " void-filter-chip--active" : ""}`}
              onClick={() => setLocale(l)}
            >
              {l === "fa" ? "فارسی" : "English"}
            </button>
          ))}
        </div>
        <p className="void-label" style={{ margin: "12px 0 8px" }}>
          {isFa ? "تقویم" : "Calendar"}
        </p>
        <div className="void-filter-chips">
          {(["jalali", "gregorian"] as CalendarSystem[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`void-filter-chip${calendar === c ? " void-filter-chip--active" : ""}`}
              onClick={() => setCalendar(c)}
            >
              {c === "jalali" ? "شمسی" : "میلادی"}
            </button>
          ))}
        </div>
        <p className="void-form-hint" style={{ marginTop: 8 }}>
          {isFa
            ? "در اینپوت‌ها با تایپ فارسی، متن راست‌چین و با فونت وزیرمتن نمایش داده می‌شود."
            : "Persian text in inputs auto-switches to RTL with Vazirmatn font."}
        </p>
      </div>

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
          <VoidInput className="void-input--pill" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="void-label">Email</label>
          <VoidInput className="void-input--pill" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
