import type { Metadata, Viewport } from "next";
import "../void-theme.css";
import "../void-theme-pro.css";
import { VoidShell } from "@/components/void/VoidShell";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `${APP_NAME} — Dashboard`,
  description: APP_DESCRIPTION
};

export const viewport: Viewport = {
  themeColor: "#0d0b14"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <VoidShell>{children}</VoidShell>;
}
