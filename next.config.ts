import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FORGE_BUILD_DIR ?? ".next",
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  turbopack: { root: process.cwd() },
};

export default nextConfig;
