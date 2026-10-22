/** @type {import('next').NextConfig} */
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const nextConfig = {
  // Hide the dev-mode issue badge so it does not show up in the demo recording.
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/status',
        destination: `${BACKEND_URL}/api/status`,
      },
      {
        source: '/api/requests',
        destination: `${BACKEND_URL}/api/requests`,
      },
      {
        source: '/api/requests/:path*',
        destination: `${BACKEND_URL}/api/requests/:path*`,
      },
      {
        source: '/api/audit',
        destination: `${BACKEND_URL}/api/audit`,
      },
      {
        source: '/api/audit/:path*',
        destination: `${BACKEND_URL}/api/audit/:path*`,
      },
      {
        source: '/api/admin/:path*',
        destination: `${BACKEND_URL}/api/admin/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
