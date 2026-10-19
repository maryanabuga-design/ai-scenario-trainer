import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // phones on the same Wi-Fi may open the dev server (otherwise Next blocks their scripts)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
