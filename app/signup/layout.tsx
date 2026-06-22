import type { Metadata, Viewport } from "next";
import "../void-theme.css";
import "./signup.css";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — Create Account`,
  description: APP_DESCRIPTION
};

export const viewport: Viewport = {
  themeColor: "#0d0b14"
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="void-signup-root">{children}</div>;
}
