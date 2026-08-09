import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/auth/'],
    },
    sitemap: 'https://forsa-app-lovat.vercel.app/sitemap.xml',
  };
}
