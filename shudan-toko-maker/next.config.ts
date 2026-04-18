import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export",
        assetPrefix: './',
      }
    : {}),
  basePath: '',
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
