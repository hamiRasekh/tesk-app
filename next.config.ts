import type { NextConfig } from "next";

const backendUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Content-Type", value: "application/manifest+json; charset=utf-8" }]
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache" }
        ]
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: `${backendUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
