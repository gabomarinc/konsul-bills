import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporalmente ignorar errores de ESLint durante builds en Vercel
    // debido a problemas de caché
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mantener verificación de TypeScript activa
    ignoreBuildErrors: false,
  },
  // Configuración para Vercel
  serverExternalPackages: ['@prisma/client', 'node-telegram-bot-api'],
  // Asegurar que Prisma se genere en cada build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
      // Evitar problemas con node-telegram-bot-api en build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
