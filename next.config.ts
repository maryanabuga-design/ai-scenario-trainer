import type { NextConfig } from "next";
import { buildId } from "./build-id";

const nextConfig: NextConfig = {
  /* config options here */
  // phones on the same Wi-Fi may open the dev server (otherwise Next blocks their scripts)
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  devIndicators: false,
  // the commit this build was made from, shown on About this prototype and at /build.json
  env: { NEXT_PUBLIC_BUILD_ID: buildId() },
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
