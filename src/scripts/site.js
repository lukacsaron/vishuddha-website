// Sticky header shrink
const hdr = document.getElementById('site-header');
if (hdr) window.addEventListener('scroll', () => {
  hdr.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));

// Service card stagger
document.querySelectorAll('.service-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.08}s`;
});

// Rolling word animation
(function() {
  const slot  = document.getElementById('rollingSlot');
  const track = document.getElementById('rollingWords');
  if (!slot || !track) return;
  const spans = Array.from(track.querySelectorAll('span'));
  const count = spans.length;
  let current = 0;
  let itemH   = 0;

  function measure() {
    // Disable transition + reset inline heights for a clean measurement
    track.style.transition = 'none';
    spans.forEach(s => { s.style.height = ''; });
    void slot.offsetHeight; // force reflow

    // getBoundingClientRect gives sub-pixel accuracy; ceil so glyphs never bleed
    itemH = Math.ceil(spans[0].getBoundingClientRect().height);

    // Slot and every span share the identical pixel height
    slot.style.height = itemH + 'px';
    spans.forEach(s => { s.style.height = itemH + 'px'; });

    // Widest word sets slot width (+2 px prevents sub-pixel width clipping)
    let maxW = 0;
    spans.forEach(s => { maxW = Math.max(maxW, s.scrollWidth); });
    slot.style.width = (maxW + 2) + 'px';

    // Snap to current word silently, then re-enable the slide transition
    track.style.transform = `translateY(-${current * itemH}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      track.style.transition = 'transform 0.55s cubic-bezier(.77,0,.175,1)';
    }));
  }

  function step() {
    current = (current + 1) % count;
    track.style.transform = `translateY(-${current * itemH}px)`;
  }

  function init() { measure(); setInterval(step, 2400); }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => setTimeout(init, 900));
  } else {
    setTimeout(init, 1200);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measure, 120);
  }, { passive: true });
})();

// ── PRELOADER ──
(function() {
  const loader = document.getElementById('preloader');
  const logo   = document.getElementById('preloaderLogo');
  if (!loader) return;
  const line   = document.getElementById('preloaderLine');

  // On a first (uncached) visit the logo is still downloading when this runs.
  // Starting the fade then made it pop in half-drawn, so wait for the file first.
  const logoLoaded = new Promise(res => {
    if (logo.complete) return res();
    logo.addEventListener('load',  res, { once: true });
    logo.addEventListener('error', res, { once: true });
  });

  // decode() makes the first painted frame the finished bitmap, but it is tied to
  // rendering and can stall indefinitely on a backgrounded tab — so never wait on
  // it for long.
  const logoReady = logoLoaded.then(() => logo.decode && Promise.race([
    logo.decode().catch(() => {}),
    new Promise(res => setTimeout(res, 150)),
  ]));

  logoReady.then(() => {
    void loader.offsetHeight; // reflow, not rAF — rAF is throttled on backgrounded tabs
    logo.classList.add('show');
    line.classList.add('show');
  });

  function hide() {
    loader.classList.add('out');
    // Must outlast the 0.9s opacity transition, or the fade gets cut off
    setTimeout(() => loader.remove(), 950);
  }

  // Hold the screen until the logo and the fonts are both in, then give the logo
  // its moment. The cap keeps a slow or failed image from trapping visitors here.
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const cap = new Promise(res => setTimeout(res, 4000));
  Promise.race([Promise.all([logoReady, fontsReady]), cap])
    .then(() => setTimeout(hide, 1200));
})();

// ── SCROLL PROGRESS ──
(function() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }, { passive: true });
})();

// ── ACTIVE NAV ──
(function() {
  const links = document.querySelectorAll('#headerNav .nav-link');
  if (!links.length) return;
  // Sections declare which nav item they belong to with data-nav, in page order
  const sections = Array.from(document.querySelectorAll('[data-nav]'))
    .map(el => ({ el, key: el.dataset.nav }));

  function updateNav() {
    const threshold = window.scrollY + window.innerHeight * 0.45;
    let active = null;
    for (const s of sections) {
      if (s.el.offsetTop <= threshold) active = s.key;
    }
    links.forEach(a => a.classList.toggle('active', a.dataset.section === active));
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();
})();

// ── EXTRA GALLERY TOGGLE ──
(function() {
  const btn   = document.getElementById('galleryToggle');
  const panel = document.getElementById('galleryPanel');
  if (!btn || !panel) return;
  let open = false;

  btn.addEventListener('click', () => {
    open = !open;
    btn.classList.toggle('open', open);
    panel.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);

    if (open) {
      panel.style.maxHeight = panel.scrollHeight + 'px';
      // Release the cap once expanded so the grid can reflow on resize
      panel.addEventListener('transitionend', function release(e) {
        if (e.propertyName !== 'max-height' || !open) return;
        panel.style.maxHeight = 'none';
        panel.removeEventListener('transitionend', release);
      });
    } else {
      // Re-apply a concrete height before collapsing, or the transition won't run
      panel.style.maxHeight = panel.scrollHeight + 'px';
      void panel.offsetHeight;
      panel.style.maxHeight = '0px';
    }
  });
})();

// ── MOBILE: REVEAL PROJECT OVERLAYS ON SCROLL ──
// Phones have no hover, so a tile lights up while it sits in the middle of the screen.
(function() {
  const cells = Array.from(document.querySelectorAll('.photo-cell'));
  if (!cells.length) return;
  const mq = window.matchMedia('(max-width: 900px)');

  function update() {
    if (!mq.matches) {
      cells.forEach(c => c.classList.remove('in-view'));
      return;
    }
    const h = window.innerHeight;
    const bandTop = h * 0.25, bandBottom = h * 0.75; // middle half of the viewport
    cells.forEach(c => {
      const r = c.getBoundingClientRect();
      c.classList.toggle('in-view', r.bottom > bandTop && r.top < bandBottom);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  mq.addEventListener('change', update);
  update();
})();

// ── VIDEO LIGHTBOX ──
(function() {
  const lb    = document.getElementById('ytLightbox');
  const frame = document.getElementById('ytFrame');
  if (!lb || !frame) return;

  let opener = null;

  function open(id, tile) {
    // referrerpolicy is required: without a valid Referer the player refuses to
    // configure itself and shows "error 153". Needs a real http(s) origin too —
    // opening the page over file:// gives an opaque origin and still fails.
    frame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" ' +
      'title="Vishuddha Productions video" ' +
      'referrerpolicy="strict-origin-when-cross-origin" ' +
      'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" ' +
      'allowfullscreen></iframe>';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    // Force a reflow rather than waiting on rAF, which browsers throttle on
    // backgrounded tabs — that would leave the lightbox stuck at opacity 0.
    void lb.offsetHeight;
    lb.classList.add('open');
    // Keyboard users land on the close button and return to the tile afterwards
    opener = tile;
    document.getElementById('ytClose').focus();
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    // Dropping the iframe is what actually stops playback
    setTimeout(() => { lb.hidden = true; frame.innerHTML = ''; }, 300);
    if (opener && opener.focus) opener.focus();
  }

  document.addEventListener('click', e => {
    const tile = e.target.closest('.g-video');
    if (tile) { open(tile.dataset.yt, tile); return; }
    if (e.target.closest('#ytClose') || e.target === lb) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lb.hidden) close();
  });

  // maxresdefault is missing on some uploads. YouTube answers those with a 120x90 grey
  // placeholder and HTTP 200 — not a 404 — so size, not the error event, is the tell.
  document.querySelectorAll('.g-video img').forEach(img => {
    function fallback() {
      if (img.dataset.fallback) return;
      img.dataset.fallback = '1';
      img.src = 'https://img.youtube.com/vi/' + img.closest('.g-video').dataset.yt + '/hqdefault.jpg';
    }
    img.addEventListener('error', fallback);
    img.addEventListener('load', () => { if (img.naturalWidth <= 120) fallback(); });
    if (img.complete && img.naturalWidth > 0 && img.naturalWidth <= 120) fallback();
  });
})();

// ── BACK TO TOP ──
(function() {
  let btn;
  window.addEventListener('scroll', () => {
    if (!btn) btn = document.getElementById('back-top');
    if (btn) btn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  document.addEventListener('click', e => {
    if (e.target.closest('#back-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ── REDUCED MOTION ──
// Visitors who ask their system for less motion get a still hero (the poster) and
// a way to start the video themselves.
(function() {
  const video = document.querySelector('.hero video');
  if (!video || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  video.removeAttribute('autoplay');
  video.pause();
  video.controls = true;
})();
