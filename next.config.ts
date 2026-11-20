import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.FORGE_BUILD_DIR ?? ".next",
  turbopack: { root: process.cwd() },
};

export default nextConfig;
