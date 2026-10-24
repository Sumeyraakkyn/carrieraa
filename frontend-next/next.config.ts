import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  reactCompiler: false,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
