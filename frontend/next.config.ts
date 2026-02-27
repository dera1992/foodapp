import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: '10mb'
  },
  experimental: {
    devtoolSegmentExplorer: false
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  }
};

export default nextConfig;
