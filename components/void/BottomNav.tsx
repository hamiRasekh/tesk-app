"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg className="void-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 11.5L12 4l8 7.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-8.5z" />
      </svg>
    )
  },
  {
    href: "/dashboard/projects",
    label: "Quests",
    icon: (
      <svg className="void-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" />
        <path d="M7 20l5-3 5 3-1.5-5.5L19 14l-5.5-1L12 7l-1.5 6L5 14l3.5.5L7 20z" opacity="0.5" />
      </svg>
    )
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    icon: (
      <svg className="void-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 18h2" />
      </svg>
    )
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg className="void-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
      </svg>
    )
  }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="void-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`void-nav__item${active ? " void-nav__item--active" : ""}`}
          >
            <span className="void-nav__icon-wrap">{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
