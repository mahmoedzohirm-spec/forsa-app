import type { NextConfig } from "next";
import withPWA from "next-pwa";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // ✅ زيادة حد حجم الطلب لرفع الصور
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // ✅ إعدادات إضافية لـ API Routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// تطبيق الـ PWA أولاً ثم الـ i18n
export default withNextIntl(withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig));
