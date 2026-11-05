import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// src/pages/hu/index.astro imports Splash, and Astro bundles a component's styles into
// every page that imports it, even when it is not rendered. A bare `body` rule here once
// turned the real Hungarian site into an empty blue screen.
const source = readFileSync(new URL('../src/components/Splash.astro', import.meta.url), 'utf8');
const css = source.match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? '';

describe('Splash styles', () => {
  it('scopes every selector under .splash', () => {
    const rules = css
      .replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
      .replace(/@media[^{]+\{/g, '');
    const selectors = [...rules.matchAll(/([^{}]+)\{/g)]
      .flatMap((m) => m[1].split(','))
      .map((s) => s.trim())
      .filter(Boolean);

    expect(selectors.length).toBeGreaterThan(5);
    expect(selectors.filter((s) => !s.startsWith('.splash'))).toEqual([]);
  });

  it('does not redefine animations used by the main site', () => {
    const names = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
    expect(names.length).toBeGreaterThan(0);
    expect(names.filter((n) => !n.startsWith('splash-'))).toEqual([]);
  });
});
