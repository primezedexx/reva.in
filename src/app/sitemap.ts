import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export const revalidate = 3600; // revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://siplo.vercel.app').replace(/\/+$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/c`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ];

  try {
    if (supabaseAdmin) {
      const { data: businesses } = await supabaseAdmin
        .from('businesses')
        .select('slug, updated_at')
        .not('slug', 'is', null)
        .limit(100);

      if (businesses && businesses.length > 0) {
        const storeRoutes: MetadataRoute.Sitemap = businesses.map((b) => ({
          url: `${baseUrl}/c/${b.slug}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : new Date(),
          changeFrequency: 'daily',
          priority: 0.8,
        }));
        return [...staticRoutes, ...storeRoutes];
      }
    }
  } catch (error) {
    console.warn('Failed to dynamically fetch businesses for sitemap:', error);
  }

  return staticRoutes;
}
