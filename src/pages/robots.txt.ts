import type { APIRoute } from 'astro';
import { getContent } from '../cms/store';

export const GET: APIRoute = () => {
  const { siteUrl } = getContent().settings;
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
