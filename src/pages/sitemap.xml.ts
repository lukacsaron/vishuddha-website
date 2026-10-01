import type { APIRoute } from 'astro';
import { getContent } from '../cms/store';

export const GET: APIRoute = () => {
  const { settings, legal } = getContent();
  const hu = settings.huEnabled;
  // Only pages that are indexable: legal pages join once they have text
  const pages: { en: string; hu: string; huReady: boolean }[] = [{ en: '/', hu: '/hu/', huReady: hu }];
  for (const page of ['privacy', 'terms'] as const) {
    if (legal[page].body.en.trim()) {
      pages.push({ en: `/${page}`, hu: `/hu/${page}`, huReady: hu && !!legal[page].body.hu.trim() });
    }
  }
  const url = (loc: string, p: (typeof pages)[number]) => `  <url>
    <loc>${settings.siteUrl}${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${settings.siteUrl}${p.en}"/>${p.huReady ? `
    <xhtml:link rel="alternate" hreflang="hu" href="${settings.siteUrl}${p.hu}"/>` : ''}
  </url>`;
  const body = pages.flatMap((p) => [url(p.en, p), ...(p.huReady ? [url(p.hu, p)] : [])]).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
