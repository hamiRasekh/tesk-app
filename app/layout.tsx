import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./native-pwa.css";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import { AppProviders } from "@/components/AppProviders";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: APP_NAME,
    startupImage: [{ url: "/icon.png" }]
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "apple-mobile-web-app-title": APP_NAME
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0d0b14" },
    { media: "(prefers-color-scheme: light)", color: "#0d0b14" }
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" suppressHydrationWarning>
      <body>
        <AppProviders>
          <div className="device-shell">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
