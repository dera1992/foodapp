/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    devtoolSegmentExplorer: false
  },
  webpack: (config: Record<string, unknown> & { cache?: unknown }, { dev }: { dev: boolean }) => {
    if (dev) {
      // Avoid flaky file-cache corruption on Windows that causes missing dev chunks.
      config.cache = false;
    }
    return config;
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
