declare module 'next-pwa' {
  import { NextConfig } from 'next';
  interface PWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    runtimeCaching?: any[];
    publicExcludes?: string[];
    buildExcludes?: any[];
  }
  function withPWA(options: PWAOptions): (config: NextConfig) => NextConfig;
  export = withPWA;
}