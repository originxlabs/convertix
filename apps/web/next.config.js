import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias.canvas = false;
    }
    config.module.rules.push({
      test: /pdf\\.worker(\\.min)?\\.mjs$/,
      type: "asset/resource"
    });
    return config;
  }
};

export default nextConfig;
