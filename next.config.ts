import type { NextConfig } from "next";
import withPWA from "next-pwa";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // أي إعدادات أخرى
};

// تطبيق الـ PWA أولاً ثم الـ i18n
export default withNextIntl(withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig));