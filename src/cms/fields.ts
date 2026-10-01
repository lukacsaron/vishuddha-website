// Describes the admin editing form. The content shape itself is defined in schema.ts;
// tests/fields.test.ts checks that every key here exists in the content.

type Base = { key: string; label: string; help?: string };

export type Field =
  | (Base & { type: 'text' | 'textarea' | 'ltext' | 'ltextarea' | 'bool' | 'image' | 'video' })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & {
      type: 'list';
      fields: Field[];
      /** Name for one entry, used on the "Add" button */
      item: string;
      /** A blank entry */
      blank: Record<string, unknown>;
      /** Key of the field that names an entry in the collapsed list */
      titleKey: string;
      /** Key of an image field to show as a thumbnail, if any */
      thumbKey?: string;
    });

export type Section = { id: string; title: string; group: 'Page' | 'Site'; intro?: string; fields: Field[] };

const L = () => ({ en: '', hu: '' });

const FOCUS_HELP = 'Which part of the photo stays visible when it is cropped, e.g. "center 20%" (20% from the top). Leave empty for the default.';
const BREAK_HELP = 'Press Enter for a line break.';

export const sections: Section[] = [
  {
    id: 'hero',
    title: 'Hero',
    group: 'Page',
    intro: 'The full-screen opening with the background video.',
    fields: [
      { key: 'hero.video', label: 'Background video: desktop (landscape)', type: 'video', help: 'MP4 or WebM, ideally under 10 MB. Plays muted and looped. Also used on phones if there is no mobile video.' },
      { key: 'hero.poster', label: 'Poster image: desktop (landscape)', type: 'image', help: 'Shown while the video loads.' },
      { key: 'hero.videoMobile', label: 'Background video: mobile (vertical)', type: 'video', help: 'Shown on phones and tablets held upright. A 9:16 clip, ideally under 5 MB.' },
      { key: 'hero.posterMobile', label: 'Poster image: mobile (vertical)', type: 'image', help: 'Shown on phones while the mobile video loads. Use a vertical frame.' },
      { key: 'hero.eyebrow', label: 'Small line above the headline', type: 'ltextarea', help: BREAK_HELP },
      { key: 'hero.staticWord', label: 'Fixed first word', type: 'ltext' },
      {
        key: 'hero.words', label: 'Rolling words', type: 'list', item: 'word', titleKey: 'en', blank: L(),
        fields: [{ key: 'en', label: 'English', type: 'text' }, { key: 'hu', label: 'Hungarian', type: 'text' }],
      },
      { key: 'hero.sub', label: 'Line under the headline', type: 'ltext', help: 'Separate items with " · ".' },
      { key: 'hero.cta', label: 'Button text', type: 'ltext' },
    ],
  },
  {
    id: 'brands',
    title: 'Client logos',
    group: 'Page',
    intro: 'The scrolling strip of logos under the hero.',
    fields: [
      { key: 'brands.label', label: 'Heading', type: 'ltext' },
      {
        key: 'brands.logos', label: 'Logos', type: 'list', item: 'logo', titleKey: 'name', thumbKey: 'image',
        blank: { name: '', image: '', size: 'md' },
        fields: [
          { key: 'name', label: 'Client name', type: 'text', help: 'Read by screen readers and search engines.' },
          { key: 'image', label: 'Logo', type: 'image', help: 'White or light artwork on a transparent background.' },
          {
            key: 'size', label: 'Display size', type: 'select',
            options: [{ value: 'md', label: 'Normal' }, { value: 'sm', label: 'Smaller' }, { value: 'xs', label: 'Smallest' }],
            help: 'Use a smaller size when the artwork fills its canvas and looks too big next to the others.',
          },
        ],
      },
    ],
  },
  {
    id: 'services',
    title: 'Services',
    group: 'Page',
    intro: 'The introduction and the alternating photo-and-text sections.',
    fields: [
      { key: 'intro.label', label: 'Intro: small label', type: 'ltext' },
      { key: 'intro.title', label: 'Intro: headline', type: 'ltextarea', help: BREAK_HELP },
      { key: 'intro.body', label: 'Intro: text', type: 'ltextarea' },
      {
        key: 'services', label: 'Service sections', type: 'list', item: 'service', titleKey: 'label', thumbKey: 'image',
        blank: { anchor: 'new-service', label: L(), title: L(), body: L(), image: '', imageAlt: L(), focus: '' },
        fields: [
          { key: 'label', label: 'Small label', type: 'ltext' },
          { key: 'title', label: 'Headline', type: 'ltextarea', help: BREAK_HELP },
          { key: 'body', label: 'Text', type: 'ltextarea' },
          { key: 'image', label: 'Photo', type: 'image' },
          { key: 'imageAlt', label: 'Photo description', type: 'ltext', help: 'For screen readers; also shown in the empty box when there is no photo.' },
          { key: 'focus', label: 'Photo focus point', type: 'text', help: FOCUS_HELP },
          { key: 'anchor', label: 'Link name', type: 'text', help: 'Used in links such as #film. Lowercase letters only. Footer links point at these.' },
        ],
      },
    ],
  },
  {
    id: 'work',
    title: 'Projects',
    group: 'Page',
    intro: 'The "Selected Projects" grid. A project without a photo shows as a dashed tile.',
    fields: [
      { key: 'work.label', label: 'Small label', type: 'ltext' },
      { key: 'work.title', label: 'Headline', type: 'ltext' },
      {
        key: 'work.projects', label: 'Projects', type: 'list', item: 'project', titleKey: 'client', thumbKey: 'image',
        blank: { client: '', service: L(), image: '' },
        fields: [
          { key: 'client', label: 'Client', type: 'text' },
          { key: 'service', label: 'What you did', type: 'ltext' },
          { key: 'image', label: 'Photo', type: 'image', help: 'Landscape works best; it is cropped to 4:3.' },
        ],
      },
    ],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    group: 'Page',
    intro: 'The mosaic behind the "Want to see more?" button. Removing every tile hides the button.',
    fields: [
      { key: 'gallery.toggle', label: 'Button text', type: 'ltext' },
      {
        key: 'gallery.tiles', label: 'Tiles', type: 'list', item: 'tile', titleKey: 'label', thumbKey: 'image',
        blank: { type: 'image', youtube: '', image: '', label: L(), size: '' },
        fields: [
          {
            key: 'type', label: 'Type', type: 'select',
            options: [{ value: 'image', label: 'Photo' }, { value: 'video', label: 'YouTube video' }, { value: 'placeholder', label: 'Empty placeholder' }],
          },
          { key: 'image', label: 'Photo', type: 'image', help: 'For a video tile this is optional: it replaces the YouTube thumbnail.' },
          { key: 'youtube', label: 'YouTube video ID', type: 'text', help: 'The part after "v=" in the address, e.g. lL5rxe1mWgQ.' },
          { key: 'label', label: 'Caption', type: 'ltext', help: 'Shown on placeholders; used as the description of photos.' },
          {
            key: 'size', label: 'Tile size', type: 'select',
            options: [
              { value: '', label: 'Small (1×1)' }, { value: 'w2', label: 'Wide (2×1)' }, { value: 'h2', label: 'Tall (1×2)' },
              { value: 'w2h2', label: 'Large (2×2)' }, { value: 'w3', label: 'Extra wide (3×1)' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'team',
    title: 'Team',
    group: 'Page',
    fields: [
      { key: 'team.label', label: 'Small label', type: 'ltext' },
      { key: 'team.title', label: 'Headline', type: 'ltext' },
      {
        key: 'team.members', label: 'People', type: 'list', item: 'person', titleKey: 'name', thumbKey: 'photo',
        blank: { name: L(), role: L(), bio: L(), photo: '', focus: '' },
        fields: [
          { key: 'name', label: 'Name', type: 'ltext' },
          { key: 'role', label: 'Role', type: 'ltext' },
          { key: 'bio', label: 'Bio', type: 'ltextarea' },
          { key: 'photo', label: 'Photo', type: 'image' },
          { key: 'focus', label: 'Photo focus point', type: 'text', help: FOCUS_HELP },
        ],
      },
    ],
  },
  {
    id: 'form',
    title: 'Contact section',
    group: 'Page',
    intro: 'The "Get in touch" section at the bottom. It shows the email address and phone number from Contact details.',
    fields: [
      { key: 'form.label', label: 'Small label', type: 'ltext' },
      { key: 'form.title', label: 'Headline', type: 'ltextarea', help: BREAK_HELP },
      { key: 'form.body', label: 'Text', type: 'ltextarea' },
      { key: 'form.emailLabel', label: 'Label above the email address', type: 'ltext' },
      { key: 'form.phoneLabel', label: 'Label above the phone number', type: 'ltext' },
    ],
  },
  {
    id: 'footer',
    title: 'Menu and footer',
    group: 'Page',
    fields: [
      { key: 'nav.services', label: 'Menu: Services', type: 'ltext' },
      { key: 'nav.work', label: 'Menu: Work', type: 'ltext' },
      { key: 'nav.team', label: 'Menu: Team', type: 'ltext' },
      { key: 'nav.contact', label: 'Menu: Contact button', type: 'ltext' },
      { key: 'footer.servicesHeading', label: 'Footer: services heading', type: 'ltext' },
      {
        key: 'footer.serviceLinks', label: 'Footer: service links', type: 'list', item: 'link', titleKey: 'label',
        blank: { label: L(), href: '#' },
        fields: [
          { key: 'label', label: 'Text', type: 'ltext' },
          { key: 'href', label: 'Goes to', type: 'text', help: 'A section such as #film, or a full address starting with https://.' },
        ],
      },
      { key: 'footer.companyHeading', label: 'Footer: company heading', type: 'ltext' },
      {
        key: 'footer.companyLinks', label: 'Footer: company links', type: 'list', item: 'link', titleKey: 'label',
        blank: { label: L(), href: '#' },
        fields: [
          { key: 'label', label: 'Text', type: 'ltext' },
          { key: 'href', label: 'Goes to', type: 'text', help: 'A section such as #team, or a full address starting with https://.' },
        ],
      },
      { key: 'footer.legalHeading', label: 'Footer: legal heading', type: 'ltext' },
      { key: 'footer.contactHeading', label: 'Footer: contact heading', type: 'ltext' },
      { key: 'footer.copyright', label: 'Copyright line', type: 'ltext', help: '{year} is replaced with the current year.' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal pages',
    group: 'Page',
    intro: 'The Privacy Policy and Terms pages linked from the footer. Until a page has text, it says it is being prepared and is hidden from search engines.',
    fields: [
      { key: 'legal.privacy.title', label: 'Privacy Policy: title', type: 'ltext' },
      { key: 'legal.privacy.body', label: 'Privacy Policy: text', type: 'ltextarea', help: 'Markdown: "## Heading", "- list item", "**bold**", "[link](https://…)".' },
      { key: 'legal.terms.title', label: 'Terms: title', type: 'ltext' },
      { key: 'legal.terms.body', label: 'Terms: text', type: 'ltextarea', help: 'Markdown, as above.' },
      { key: 'legal.empty', label: 'Message while a page is empty', type: 'ltext' },
    ],
  },
  {
    id: 'contact',
    title: 'Contact details',
    group: 'Site',
    intro: 'Shown in the header, the contact section and the footer. Social icons appear only when a link is filled in.',
    fields: [
      { key: 'contact.phone', label: 'Phone', type: 'text' },
      { key: 'contact.email', label: 'Email', type: 'text' },
      { key: 'social.instagram', label: 'Instagram link', type: 'text' },
      { key: 'social.facebook', label: 'Facebook link', type: 'text' },
      { key: 'social.linkedin', label: 'LinkedIn link', type: 'text' },
    ],
  },
  {
    id: 'seo',
    title: 'Search and sharing',
    group: 'Site',
    intro: 'What Google and social networks show for the site.',
    fields: [
      { key: 'seo.title', label: 'Page title', type: 'ltext', help: 'About 60 characters.' },
      { key: 'seo.description', label: 'Description', type: 'ltextarea', help: 'About 155 characters.' },
      { key: 'seo.keywords', label: 'Keywords', type: 'ltextarea' },
      { key: 'seo.ogImage', label: 'Sharing image', type: 'image', help: 'Shown when the site is shared. 1200 × 630 works best.' },
    ],
  },
  {
    id: 'coming-soon',
    title: 'Coming soon page',
    group: 'Site',
    intro: 'Hides the whole site behind a single "coming soon" page, for example before launch or during a bigger rework. While you are signed in here you still see the real site, so you can keep working on it.',
    fields: [
      { key: 'comingSoon.enabled', label: 'Show the coming soon page to visitors', type: 'bool', help: 'Takes effect as soon as you save. Search engines are told the site is temporarily unavailable, so it does not replace your pages in Google.' },
      { key: 'comingSoon.title', label: 'Headline', type: 'ltext' },
      { key: 'comingSoon.text', label: 'Line below', type: 'ltext' },
      { key: 'comingSoon.cta', label: 'Button text', type: 'ltext', help: 'The button opens an email to the address in Contact details, which is also shown under it with the phone number. Leave empty to hide the button.' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    group: 'Site',
    fields: [
      { key: 'settings.huEnabled', label: 'Hungarian site is live', type: 'bool', help: 'Off: visitors to /hu/ see the "work in progress" page. While signed in here you can still preview the Hungarian site at /hu/.' },
      { key: 'wip.title', label: 'Placeholder page: headline', type: 'text' },
      { key: 'wip.sub', label: 'Placeholder page: line below', type: 'text' },
      { key: 'wip.back', label: 'Placeholder page: button', type: 'text' },
      { key: 'settings.siteUrl', label: 'Site address', type: 'text', help: 'Like https://vishuddhaproductions.com, without a slash at the end. Used in links for search engines.' },
    ],
  },
];
