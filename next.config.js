/** @type {import('next').NextConfig} */
const isExportMode = process.env.NEXT_OUTPUT_MODE === "export";

const nextConfig = {
  ...(isExportMode ? { output: "export" } : {}),
  distDir: "out",
  images: { unoptimized: true },
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
