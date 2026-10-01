// Initial content. English comes from legacy/index.html, Hungarian from
// legacy/hu-full-translation.html.bak. Once anything is saved in the admin,
// DATA_DIR/content.json takes over and this file only supplies defaults for new fields.
import type { Content, Localised } from './schema';

const l = (en: string, hu: string): Localised => ({ en, hu });

const photo = (size: Content['gallery']['tiles'][number]['size'], en = 'Photo', hu = 'Fotó') =>
  ({ type: 'placeholder' as const, youtube: '', image: '', label: l(en, hu), size });
const video = (youtube: string) =>
  ({ type: 'video' as const, youtube, image: '', label: l('', ''), size: 'w2h2' as const });
const logo = (name: string, file: string, size: 'md' | 'sm' | 'xs' = 'md') =>
  ({ name, image: `/media/logos/${file}.webp`, size });

export const seed: Content = {
  settings: {
    siteUrl: 'https://vishuddhaproductions.com',
    huEnabled: false,
  },
  seo: {
    title: l(
      'Vishuddha Productions | Film, Photo & Social Media, Budapest',
      'Vishuddha Productions | Film, Fotó és Social Media, Budapest',
    ),
    description: l(
      'Budapest-based micro-production company for film production, photography, social media management and PPC advertising. One team, every channel.',
      'Budapesti mikro-ügynökség: filmgyártás, fotózás, közösségi média kezelés és PPC hirdetések. Egy csapat, minden platform.',
    ),
    ogImage: '/media/og-image.jpg',
  },
  contact: {
    phone: '+36 20 333 7305',
    email: 'hello@vishuddhaproductions.com',
  },
  social: {
    instagram: 'https://instagram.com/vishuddha.productions',
    facebook: '',
    linkedin: '',
  },
  nav: {
    services: l('Services', 'Szolgáltatások'),
    work: l('Work', 'Munkáink'),
    team: l('Team', 'Csapat'),
    contact: l('Contact', 'Kapcsolat'),
    menu: l('Menu', 'Menü'),
  },
  hero: {
    video: '/media/hero.mp4',
    poster: '/media/hero-poster.webp',
    // Centre crop of the landscape clip: what phones showed anyway, at a quarter of the download
    videoMobile: '/media/hero-mobile.mp4',
    posterMobile: '/media/hero-mobile-poster.webp',
    eyebrow: l('Budapest-based\nmicro-production company', 'Budapesti\nmikro-ügynökség'),
    staticWord: l('We', 'Mi'),
    words: [
      l('create', 'alkotunk'),
      l('manage', 'szervezünk'),
      l('shoot', 'forgatunk'),
      l('visualise', 'vizualizálunk'),
      l('brand', 'brandet építünk'),
      l('grow you', 'növelünk'),
    ],
    sub: l(
      'Film Production · Photography · Social Media · Digital Marketing',
      'Filmgyártás · Fotózás · Social Media · Digitális Marketing',
    ),
    cta: l('Get in Touch', 'Kapcsolatfelvétel'),
  },
  brands: {
    label: l("Brands we've worked with", 'Partnereink'),
    logos: [
      logo('Atelier', 'atelier'),
      logo('Beton.hofi', 'betonhofi', 'sm'),
      logo('Budapest Bagel', 'budapestbagel'),
      logo('Fővárosi Nagycirkusz', 'cirkusz'),
      logo('Villa Cuvée', 'cuvee'),
      logo('Hotel Délibáb', 'delibab'),
      logo('Delta Produkció', 'delta', 'xs'),
      logo('Medve Sajt', 'medve'),
      logo('OTP Bank', 'otp'),
      logo('Petraflow', 'petraflow'),
      logo('Színkör', 'szinkor'),
      logo('Theodora', 'theodora'),
      logo('Trip', 'trip'),
    ],
  },
  intro: {
    label: l('What We Do', 'Amit Csinálunk'),
    title: l('One Team.\nEvery Channel.\nFully Managed.', 'Egy Csapat.\nMinden Platform.\nTeljes Körűen.'),
    body: l(
      'We help businesses build their online presence and reach the right audience, through integrated social media management, PPC advertising, and high-quality visual content production. Whatever your ambitions and whatever your budget, we build an approach that fits your goals.',
      'Segítünk vállalkozásoknak megteremteni az online jelenlétüket és elérni a megfelelő közönséget, integrált közösségi média kezeléssel, PPC hirdetésekkel és minőségi vizuális tartalomgyártással. Akármilyen nagy az ambíciód vagy szűk a büdzsé, mi megtaláljuk a megfelelő megközelítést a céljaidhoz.',
    ),
  },
  services: [
    {
      anchor: 'film',
      label: l('Film Production', 'Filmgyártás'),
      title: l('No Matter How Big Your Dreams Are.', 'Álmodj Bátran.'),
      body: l(
        'Even on a modest budget, we assemble the right creative crew for the job. With experience spanning every production scale, from a short social media clip to a full broadcast campaign, we deliver high-quality video content and can arrange media placement to extend your reach.',
        'Akármilyen szűk a büdzsé, mi megtaláljuk a megfelelő kreatív stábot. A legkisebb social média kliptől a nagyszabású kampányokig minden skálán otthon vagyunk — minőségi videótartalmat gyártunk, és szükség esetén a médiaelhelyezést is intézzük.',
      ),
      image: '/media/services/film.webp',
      imageAlt: l('Film Production', 'Filmgyártás'),
      focus: '',
    },
    {
      anchor: 'photo',
      label: l('Photography', 'Fotózás'),
      title: l('From Social to Campaign Scale.', 'Social Poszttól a Nagy Kampányig.'),
      body: l(
        'Social content photography. Large-scale campaign shoots. Product photography. Brand identity visuals. Whatever the brief, we match the right crew and approach to deliver exactly what your business needs.',
        'Social média fotózás. Nagyszabású kampányfotók. Termékfotózás. Brand identity vizuálok. Bármilyen brief érkezik, mi megtaláljuk a megfelelő stábot és megközelítést, hogy pontosan azt kapd, amire a vállalkozásodnak szüksége van.',
      ),
      // The original pointed at services/photography.png, which was never delivered
      image: '',
      imageAlt: l('Photography', 'Fotózás'),
      focus: 'center 85%',
    },
    {
      anchor: 'social',
      label: l('Social Media & Digital Marketing', 'Social Media & Digitális Marketing'),
      title: l('Every Platform. One Strategy.', 'Minden Platform. Egy Stratégia.'),
      body: l(
        'Google Ads. Facebook and Instagram Ads. TikTok. We manage your paid and organic channels with one integrated strategy. Content creation, precise audience targeting, and ongoing optimisation — backed by 5+ years of PPC and social media management experience across a wide range of industries.',
        'Google Ads. Facebook és Instagram hirdetések. TikTok. Kezeljük fizetett és organikus csatornáidat egy integrált stratégiával. Tartalomgyártás, precíz célzás és folyamatos optimalizáció, több mint 5 év PPC és social média kezelési tapasztalattal, számos iparágban.',
      ),
      image: '/media/services/marketing.webp',
      imageAlt: l('Digital Marketing & Social Media', 'Digitális Marketing és Social Media'),
      focus: 'center 20%',
    },
  ],
  work: {
    label: l('Our Work', 'Munkáink'),
    title: l('Selected Projects', 'Válogatott Projektek'),
    projects: [
      { client: 'OTP Bank', service: l('Photography', 'Fotózás'), image: '/media/work/otp.webp' },
      { client: 'Medve Sajt', service: l('Film Production & Photography', 'Filmgyártás és Fotózás'), image: '/media/work/medve.webp' },
      { client: 'Budapest Bägel', service: l('Digital Marketing', 'Digitális Marketing'), image: '/media/work/bagel.webp' },
      { client: 'Theodora', service: l('Film Production', 'Filmgyártás'), image: '/media/work/theodora.webp' },
      { client: 'Villa Cuvée', service: l('Digital Marketing', 'Digitális Marketing'), image: '/media/work/villa.webp' },
      { client: 'Nem Oké', service: l('Film Production', 'Filmgyártás'), image: '/media/work/nemoke.webp' },
      { client: 'Hotel Délibáb', service: l('Full Package', 'Teljes Csomag'), image: '' },
      { client: 'Beton.hofi', service: l('Film Production', 'Filmgyártás'), image: '' },
      { client: 'TRIP x Fővárosi Nagycirkusz', service: l('Film Production', 'Filmgyártás'), image: '' },
    ],
  },
  gallery: {
    toggle: l('Want to see more?', 'Szeretnél többet látni?'),
    tiles: [
      video('lL5rxe1mWgQ'),
      photo(''),
      photo(''),
      photo('w2', 'Behind the scenes', 'Werk'),
      photo('w2', 'On set', 'Forgatáson'),
      photo('w2', 'Campaign stills', 'Kampányfotók'),
      photo('h2'),
      video('raO7TtQnwSU'),
      photo(''),
      photo(''),
      photo(''),
      photo('w2', 'Product shoot', 'Termékfotózás'),
      photo(''),
      photo('w2', 'Location', 'Helyszín'),
      video('1CLqEgTHrDM'),
      photo(''),
      photo(''),
      photo('w3', 'Brand stills', 'Brand fotók'),
      photo(''),
      video('xArMfjnurhQ'),
      photo(''),
      photo(''),
      photo('w2', 'Studio', 'Stúdió'),
      photo('w2', 'Crew', 'Stáb'),
      photo('w2', 'Stills', 'Állóképek'),
      photo('h2'),
      video('ku0cxEeXB_A'),
      photo(''),
      photo(''),
    ],
  },
  team: {
    label: l('About Us', 'Rólunk'),
    title: l('The People Behind the Work', 'Az Emberek a Munka Mögött'),
    members: [
      {
        name: l('Nikolett Meister', 'Meister Nikolett'),
        role: l('Producer', 'Producer'),
        bio: l(
          "Having started as a costume assistant, Nikolett had the chance to see filmmaking from the crew's perspective. After gaining that experience, she jumped into the production side in her mid-20s. Since then, she enthusiastically seeks new challenges, however tight the budget, while combining different fields of art through film. The most important goal for her is to enjoy the work and always make sure that the crew does too.",
          '2016-ban újságíróként végeztem az egyetemen, azonban az elmúlt közel 10 évemet a filmgyártásnak szenteltem. A legkisebb produkcióktól kezdve Netflix méretű projekteken át minden területen bizonyítottam gyártásvezetőként. Széles kapcsolatrendszeremnek köszönhetően szinte bármely típusú tartalomhoz meg tudom találni a tökéletes szakembert. A logisztikai szervezés mellett magabiztos vizuális látásmóddal rendelkezem, így az alapvető képi és videós anyagok megalkotását egy kézben tudom felügyelni.',
        ),
        photo: '/media/team/niki.webp',
        focus: '',
      },
      {
        name: l('Balázs Koncz', 'Koncz Balázs'),
        role: l('Digital Marketing Specialist', 'Digitális Marketing Specialista'),
        bio: l(
          "With over 5 years of experience in digital marketing, Balázs specialises in building and executing tailored advertising strategies that drive real business growth. He has worked with more than 100 clients, from large enterprises to small and medium-sized businesses, across a diverse range of industries. Regardless of sector or company size, he approaches every partnership with the same commitment: a deep understanding of the client's business, and strategies built around their unique goals.",
          'Több mint 5 év digitális marketing tapasztalattal egyedi hirdetési stratégiákat építek, amelyek valódi üzleti növekedést hoznak ügyfeleimnek. 100-nál több partnerrel dolgoztam együtt, nagy vállalatoktól kis- és középvállalkozásokig, rengeteg különböző iparágban. Minden partnerségnél ugyanazzal a szemlélettel állok hozzá: mélyen megérteni az ügyfél üzletét és olyan stratégiát építeni, ami az ő céljaihoz igazodik.',
        ),
        photo: '/media/team/balazs.webp',
        focus: 'center 15%',
      },
    ],
  },
  form: {
    label: l('Get in Touch', 'Kapcsolatfelvétel'),
    title: l("Tell Us What\nYou're Working On.", 'Meséld El, Min\nDolgozol.'),
    body: l(
      "Share the details of your project and we'll get back to you with ideas, timelines, and an honest assessment of how we can help.",
      'Oszd meg a projekted részleteit, és visszajelzünk ötletekkel, ütemtervvel és egy őszinte értékeléssel arról, hogyan tudunk segíteni.',
    ),
    emailLabel: l('Email', 'Email'),
    phoneLabel: l('Phone', 'Telefon'),
  },
  footer: {
    servicesHeading: l('Services', 'Szolgáltatások'),
    serviceLinks: [
      { label: l('Film Production', 'Filmgyártás'), href: '#film' },
      { label: l('Photography', 'Fotózás'), href: '#photo' },
      { label: l('Social Media', 'Social Media'), href: '#social' },
      { label: l('Digital Marketing', 'Digitális Marketing'), href: '#social' },
    ],
    companyHeading: l('Company', 'Cég'),
    companyLinks: [
      { label: l('About Us', 'Rólunk'), href: '#team' },
      { label: l('Our Work', 'Munkáink'), href: '#work' },
    ],
    legalHeading: l('Legal', 'Jogi információk'),
    contactHeading: l('Contact', 'Elérhetőség'),
    copyright: l(
      '© {year} Vishuddha Productions. All rights reserved.',
      '© {year} Vishuddha Productions. Minden jog fenntartva.',
    ),
  },
  legal: {
    privacy: {
      title: l('Privacy Policy', 'Adatvédelmi Tájékoztató'),
      body: l('', ''),
    },
    terms: {
      title: l('Terms & Conditions', 'Általános Szerződési Feltételek'),
      body: l('', ''),
    },
    empty: l('This page is being prepared.', 'Ez az oldal készül.'),
  },
  wip: {
    title: 'Work in progress',
    sub: 'A magyar nyelvű oldal készül',
    back: 'English site',
  },
  comingSoon: {
    enabled: false,
    title: l('Coming soon', 'Hamarosan'),
    text: l('Our new website is on its way', 'Új weboldalunk hamarosan érkezik'),
    cta: l('Get in touch', 'Kapcsolatfelvétel'),
  },
};
