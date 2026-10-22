/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root to this folder (the repo also has frontend/ with its own lockfile).
  turbopack: { root: __dirname },
};
module.exports = nextConfig;
