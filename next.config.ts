import type { NextConfig } from "next";

const backendUrl = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
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
