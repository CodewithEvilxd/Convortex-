import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure proper handling of API routes
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Disable static optimization for dynamic routes
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Headers for better caching control
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
