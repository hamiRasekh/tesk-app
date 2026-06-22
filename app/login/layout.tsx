import type { Metadata, Viewport } from "next";
import "../void-theme.css";
import "./login.css";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — Login`,
  description: APP_DESCRIPTION
};

export const viewport: Viewport = {
  themeColor: "#131317"
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="void-login-root">{children}</div>;
}
