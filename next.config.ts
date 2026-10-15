import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors must fail the build (tsc passes cleanly)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
