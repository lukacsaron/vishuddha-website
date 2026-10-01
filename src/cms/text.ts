import { marked } from 'marked';

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

/** Splits on newlines so templates can put a <br> between the parts. */
export const lines = (s: string): string[] => s.split('\n');

/** Escaped text where [label](href) becomes a link. Used for the consent sentence. */
export function inline(s: string): string {
  return escapeHtml(s).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label, href) =>
    SAFE_HREF.test(href) ? `<a href="${href}">${label}</a>` : whole);
}

/** "A · B · C" with non-breaking spaces around the dots, as in the original hero line. */
export const dotted = (s: string): string =>
  s.split('·').map((part) => part.trim()).join(' · ');

/** Markdown for the legal pages. Raw HTML in the source is shown as text, not executed. */
export function markdown(s: string): string {
  const html = marked.parse(s.replace(/&/g, '&amp;').replace(/</g, '&lt;'), { async: false, gfm: true });
  return html.replace(/href="([^"]*)"/g, (whole, href) => (SAFE_HREF.test(href) ? whole : 'href="#"'));
}

export const year = (s: string): string => s.replace('{year}', String(new Date().getFullYear()));
