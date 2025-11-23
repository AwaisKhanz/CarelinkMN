/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@carelink/ui",
    "@carelink/utils",
    "@carelink/types",
    "@carelink/auth",
    "@carelink/database",
  ],

  images: {
    domains: ["res.cloudinary.com", "carelinkmn.com"],
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    instrumentationHook: true,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' http://localhost:3001 ws://localhost:3001 https://api.mapbox.com",
              "frame-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:3001/api/auth/:path*",
      },
      {
        source: "/api/organizations/:path*",
        destination: "http://localhost:3001/api/organizations/:path*",
      },
      {
        source: "/api/providers/:path*",
        destination: "http://localhost:3001/api/providers/:path*",
      },
      {
        source: "/api/homes/:path*",
        destination: "http://localhost:3001/api/homes/:path*",
      },
      {
        source: "/api/amenities/:path*",
        destination: "http://localhost:3001/api/amenities/:path*",
      },
      {
        source: "/api/upload/:path*",
        destination: "http://localhost:3001/api/upload/:path*",
      },
      {
        source: "/api/onboarding/:path*",
        destination: "http://localhost:3001/api/onboarding/:path*",
      },
      {
        source: "/api/health",
        destination: "http://localhost:3001/health",
      },
    ];
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
