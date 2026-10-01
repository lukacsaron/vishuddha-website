import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  server: { host: true },
  // The old static site linked to these file names
  redirects: {
    '/index.html': '/',
    '/hu.html': '/hu/',
  },
  // src/middleware.ts does the cross-site check itself, by host, so it also works
  // behind a TLS-terminating proxy where Astro's own origin comparison would not.
  security: { checkOrigin: false },
  devToolbar: { enabled: false },
});
