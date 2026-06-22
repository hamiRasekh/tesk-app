import type { Metadata, Viewport } from "next";
import "../void-theme.css";
import "./signup.css";

export const metadata: Metadata = {
  title: "Void Spirit — Summon Account",
  description: "Join the void and master your tasks."
};

export const viewport: Viewport = {
  themeColor: "#0d0b14"
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="void-signup-root">{children}</div>;
}
