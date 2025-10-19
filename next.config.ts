import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  // В Next 15 свойство перенесено в корень
  serverExternalPackages: ['iconv-lite'],
  // Разрешение кросс-ориджин запросов для превью чата
  allowedDevOrigins: [
    'preview-chat-830bbaed-235c-4324-a8fe-778fd4c2e86c.space.z.ai',
    'space.z.ai'
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    return config;
  },
  eslint: {
    // 构建时忽略ESLint错误
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
