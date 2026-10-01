import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, sameOrigin, verifySession } from './cms/auth';
import { getContent } from './cms/store';

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

// Assets and files that must keep working while the coming soon page is on
const EXEMPT_FROM_COMING_SOON = /^\/(uploads|media|_astro|_image)\/|^\/(robots\.txt|favicon\.png)$/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const { method } = context.request;
  const isApi = pathname.startsWith('/api/');
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  context.locals.isAdmin = verifySession(context.cookies.get(SESSION_COOKIE)?.value);

  // Cross-site requests must not be able to change anything
  if ((isApi || isAdminArea) && method !== 'GET' && method !== 'HEAD' && !sameOrigin(context.request)) {
    return json(403, 'Cross-site request refused');
  }

  if (isAdminArea && !context.locals.isAdmin && pathname !== '/admin/login') {
    return pathname.startsWith('/api/') ? json(401, 'Not signed in') : context.redirect('/admin/login');
  }

  // Coming soon: every public page is replaced by one notice. Admins keep seeing the
  // real site; the admin, the APIs and media stay reachable.
  const isPublicPage = !isAdminArea && !isApi && !EXEMPT_FROM_COMING_SOON.test(pathname);
  const comingSoon = isPublicPage && getContent().comingSoon.enabled;
  context.locals.comingSoonPreview = comingSoon && context.locals.isAdmin;

  const response = comingSoon && !context.locals.isAdmin && pathname !== '/coming-soon'
    ? await context.rewrite(`/coming-soon${pathname.startsWith('/hu') ? '?lang=hu' : ''}`)
    : await next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // The YouTube player in the lightbox refuses to start without a referrer
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isAdminArea) response.headers.set('Cache-Control', 'no-store');
  return response;
});
