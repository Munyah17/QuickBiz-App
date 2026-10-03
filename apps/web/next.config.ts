import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@quickbiz/supabase"],
  // Browser-preview proxies the dev server via 127.0.0.1 — allow it or
  // Next.js blocks the JS chunks and the previewed app appears broken.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
