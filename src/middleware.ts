import { defineMiddleware } from 'astro:middleware';
import { SESSION_COOKIE, sameOrigin, verifySession } from './cms/auth';

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });

export const onRequest = defineMiddleware((context, next) => {
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

  return next();
});
