import { describe, expect, it } from 'vitest';
import { dotted, inline, markdown, year } from '../src/cms/text';

describe('inline', () => {
  it('turns [label](href) into a link and escapes everything else', () => {
    expect(inline('Read the [Privacy Policy](/privacy) & <b>agree</b>'))
      .toBe('Read the <a href="/privacy">Privacy Policy</a> &amp; &lt;b&gt;agree&lt;/b&gt;');
  });

  it('leaves unsafe links as plain text', () => {
    expect(inline('[x](javascript:alert(1))')).not.toContain('<a');
    expect(inline('[x](//evil.test)')).not.toContain('<a');
    expect(inline('[x]("onmouseover="alert(1))')).not.toContain('<a');
  });
});

describe('markdown', () => {
  it('renders headings, lists and links', () => {
    const html = markdown('## Data\n\n- one\n- two\n\nSee [us](https://example.com).');
    expect(html).toContain('<h2>Data</h2>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<a href="https://example.com">us</a>');
  });

  it('shows raw HTML as text and neutralises script links', () => {
    expect(markdown('<script>alert(1)</script>')).not.toContain('<script');
    expect(markdown('<img src=x onerror=alert(1)>')).not.toContain('<img');
    expect(markdown('[x](javascript:alert(1))')).not.toContain('javascript:');
  });
});

describe('helpers', () => {
  it('joins dotted items with non-breaking spaces', () => {
    expect(dotted('A · B·C')).toBe('A · B · C');
  });

  it('fills in the year', () => {
    expect(year('© {year} X')).toBe(`© ${new Date().getFullYear()} X`);
  });
});
