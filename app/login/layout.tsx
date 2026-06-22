import type { Metadata, Viewport } from "next";
import "./login.css";

export const metadata: Metadata = {
  title: "Void Spirit — Login",
  description: "Master your tasks, conquer your spirit."
};

export const viewport: Viewport = {
  themeColor: "#131317"
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <div className="void-login-root">{children}</div>;
}
