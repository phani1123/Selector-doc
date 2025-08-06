import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Configure PDF.js and canvas handling
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Handle PDF.js worker and prevent SSR issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'pdfjs-dist/build/pdf.worker.min.js': 'commonjs pdfjs-dist/build/pdf.worker.min.js',
      });
    }

    // Ignore canvas and other browser-only modules on server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
    };
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/pdf.worker.min.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: process.env.NODE_ENV === 'development' 
              ? 'no-cache, no-store, must-revalidate' 
              : 'public, max-age=86400', // 24 hours in production
          },
        ],
      },
    ];
  },
};

export default nextConfig;
