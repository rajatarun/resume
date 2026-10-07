/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  experimental: {
    typedRoutes: true,
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      // Do not ship Node's `crypto` to the browser. The only importer is
      // lib/authToken.ts, whose HMAC signing runs at build time on the server
      // and returns before reaching it in the browser; the polyfill Next
      // substitutes (crypto-browserify, ~190 KB gzipped) was still downloaded
      // and parsed on every page: the largest single main-thread task in
      // Lighthouse. With this, `crypto` resolves to an empty module client-side.
      // An alias, not a fallback: Next maps `crypto` to its compiled polyfill
      // before fallbacks are consulted, so a fallback alone left it bundled.
      config.resolve.alias = { ...config.resolve.alias, crypto: false };
    }
    return config;
  },
};

module.exports = nextConfig;
