"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home", icon: "/home.png" },
  { href: "/dashboard/projects", label: "Projects", icon: "/project.png" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "/calender.png" },
  { href: "/dashboard/profile", label: "Profile", icon: "/profile.png" }
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="void-nav" aria-label="Main navigation">
      <div className="void-nav__pill">
        {tabs.map((tab) => {
          const active =
            tab.href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/tasks")
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`void-nav__item${active ? " void-nav__item--active" : ""}`}
              aria-label={tab.label}
              title={tab.label}
            >
              <span className="void-nav__icon-wrap">
                {active ? <span className="void-nav__glow" aria-hidden="true" /> : null}
                <img src={tab.icon} alt="" className="void-nav__icon-img" draggable={false} />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
