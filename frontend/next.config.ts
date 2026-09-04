import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Keep `next dev` and `next build` from sharing one .next folder.
  // A production build was wiping the running app’s CSS/JS and 404ing assets.
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
};

export default nextConfig;
