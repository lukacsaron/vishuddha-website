import { z } from 'zod';

export const LANGS = ['en', 'hu'] as const;
export type Lang = (typeof LANGS)[number];

/** A translatable string. A newline is a line break on the page. */
const L = z.object({ en: z.string(), hu: z.string() });
export type Localised = z.infer<typeof L>;

/** Site-relative path (/media/..., /uploads/...) or an absolute http(s) URL. Empty means "none". */
const media = z.string().refine((v) => v === '' || /^(\/(?!\/)|https?:\/\/)/.test(v), 'Must be a site path or URL');
const url = z.string().refine((v) => v === '' || /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/.test(v), 'Must be a link');

const link = z.object({ label: L, href: url });

export const contentSchema = z.object({
  settings: z.object({
    siteUrl: z.string().regex(/^https?:\/\/[^/]+$/, 'Like https://example.com, no trailing slash'),
    huEnabled: z.boolean(),
  }),
  seo: z.object({
    title: L,
    description: L,
    keywords: L,
    ogImage: media,
  }),
  contact: z.object({
    phone: z.string(),
    email: z.string(),
  }),
  social: z.object({
    instagram: url,
    facebook: url,
    linkedin: url,
  }),
  nav: z.object({ services: L, work: L, team: L, contact: L }),
  hero: z.object({
    video: media,
    poster: media,
    eyebrow: L,
    staticWord: L,
    words: z.array(L).min(1),
    sub: L,
    cta: L,
  }),
  brands: z.object({
    label: L,
    logos: z.array(z.object({
      name: z.string(),
      image: media,
      size: z.enum(['md', 'sm', 'xs']),
    })),
  }),
  intro: z.object({ label: L, title: L, body: L }),
  services: z.array(z.object({
    anchor: z.string().regex(/^[a-z][a-z0-9-]*$/, 'Lowercase letters, digits and dashes'),
    label: L,
    title: L,
    body: L,
    image: media,
    imageAlt: L,
    focus: z.string(),
  })),
  work: z.object({
    label: L,
    title: L,
    projects: z.array(z.object({ client: z.string(), service: L, image: media })),
  }),
  gallery: z.object({
    toggle: L,
    tiles: z.array(z.object({
      type: z.enum(['video', 'image', 'placeholder']),
      youtube: z.string().regex(/^[\w-]{0,20}$/, 'Just the video ID, e.g. lL5rxe1mWgQ'),
      image: media,
      label: L,
      size: z.enum(['', 'w2', 'h2', 'w2h2', 'w3']),
    })),
  }),
  team: z.object({
    label: L,
    title: L,
    members: z.array(z.object({ name: L, role: L, bio: L, photo: media, focus: z.string() })),
  }),
  form: z.object({
    label: L,
    title: L,
    body: L,
    name: L,
    namePlaceholder: L,
    phone: L,
    phonePlaceholder: L,
    company: L,
    companyPlaceholder: L,
    email: L,
    emailPlaceholder: L,
    service: L,
    servicePlaceholder: L,
    options: z.array(z.object({ value: z.string().min(1), label: L })),
    message: L,
    messagePlaceholder: L,
    consent: L,
    submit: L,
    successTitle: L,
    successBody: L,
    errorRequired: L,
    errorEmail: L,
    errorPhone: L,
    errorPhoneSuffix: L,
    errorSend: L,
  }),
  footer: z.object({
    servicesHeading: L,
    serviceLinks: z.array(link),
    companyHeading: L,
    companyLinks: z.array(link),
    legalHeading: L,
    contactHeading: L,
    copyright: L,
  }),
  legal: z.object({
    privacy: z.object({ title: L, body: L }),
    terms: z.object({ title: L, body: L }),
    empty: L,
  }),
  wip: z.object({ title: z.string(), sub: z.string(), back: z.string() }),
});

export type Content = z.infer<typeof contentSchema>;

export const t = (value: Localised, lang: Lang): string => value[lang] || value.en;
