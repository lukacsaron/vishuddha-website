import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, sameOrigin, verifySession } from './cms/auth';
import { getContent } from './cms/store';

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

// Assets and files that must keep working while the coming soon page is on
const EXEMPT_FROM_COMING_SOON = /^\/(uploads|media|_astro|_image)\/|^\/(robots\.txt|favicon\.png)$/;

// The site runs its own scripts only. Images and video may also come from a full
// https address typed into the admin; YouTube supplies gallery thumbnails and the player.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "media-src 'self' https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const { method } = context.request;
  const isApi = pathname.startsWith('/api/');
  const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

  // One canonical host: www.example.com goes to the address set in Settings
  const host = context.request.headers.get('host') ?? '';
  const canonical = getContent().settings.siteUrl;
  if (host === `www.${new URL(canonical).host}` && (method === 'GET' || method === 'HEAD')) {
    return context.redirect(canonical + pathname + context.url.search, 301);
  }

  // One address per page: /hu and /hu/ would otherwise be two copies
  if (pathname === '/hu' && (method === 'GET' || method === 'HEAD')) {
    return context.redirect('/hu/' + context.url.search, 301);
  }

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
  if (context.request.headers.get('x-forwarded-proto') === 'https') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000');
  }
  // Not in dev: Vite's hot reloading needs inline scripts and a websocket
  if (import.meta.env.PROD) response.headers.set('Content-Security-Policy', CSP);
  return response;
});
