import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // basePathやassetPrefixが必要な場合はここに追加
  assetPrefix: './',
  basePath: '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
