"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Drawer } from "./Drawer";
import { useVoid } from "@/lib/void-store";

export function AppHeader() {
  const { state } = useVoid();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? state.tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <>
      <header className="void-topbar">
        <div className="void-topbar__brand">
          <img src="/normal-1.png" alt="" className="void-topbar__logo" />
          <span className="void-topbar__name">Void Spirit</span>
        </div>
        <button type="button" className="void-topbar__search" aria-label="Search" onClick={() => setSearchOpen(true)}>
          <Search size={20} />
        </button>
      </header>

      <Drawer open={searchOpen} onClose={() => setSearchOpen(false)}>
        <div className="void-drawer__body">
          <h2 className="void-drawer__title">Search Essences</h2>
          <input
            className="void-input void-input--pill"
            placeholder="Find quests, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {results.length === 0 && query && <p className="void-empty">No matches in the void.</p>}
          {results.map((t) => (
            <div key={t.id} className="void-task-row" style={{ padding: "12px 0" }}>
              <span className={`void-task-dot void-task-dot--${t.priority}`} />
              <span className="void-task-row__title">{t.title}</span>
            </div>
          ))}
        </div>
      </Drawer>
    </>
  );
}
