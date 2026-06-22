import type { Metadata, Viewport } from "next";
import "../void-theme.css";
import "../void-theme-pro.css";
import { VoidShell } from "@/components/void/VoidShell";

export const metadata: Metadata = {
  title: "Void Spirit — Dashboard",
  description: "Master your tasks, conquer your spirit."
};

export const viewport: Viewport = {
  themeColor: "#0d0b14"
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <VoidShell>{children}</VoidShell>;
}
