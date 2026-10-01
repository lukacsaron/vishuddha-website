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

// Custom select dropdown
document.querySelectorAll('.form-group select').forEach(native => {
  const wrap = document.createElement('div');
  wrap.className = 'csel-wrap';

  const trigger = document.createElement('div');
  trigger.className = 'csel-trigger';
  trigger.innerHTML = `<span class="csel-label">${native.options[0].text}</span><svg class="csel-arrow" width="12" height="7" viewBox="0 0 12 7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1l5 5 5-5"/></svg>`;

  const dropdown = document.createElement('div');
  dropdown.className = 'csel-dropdown';

  Array.from(native.options).slice(1).forEach(opt => {
    const item = document.createElement('div');
    item.className = 'csel-option';
    item.dataset.value = opt.value;
    item.textContent = opt.text;
    item.addEventListener('click', () => {
      native.value = opt.value;
      trigger.querySelector('.csel-label').textContent = opt.text;
      trigger.classList.add('filled');
      trigger.classList.remove('open', 'error');
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.csel-option').forEach(o => o.classList.remove('selected'));
      item.classList.add('selected');
      native.dispatchEvent(new Event('change'));
    });
    dropdown.appendChild(item);
  });

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    // close all other open dropdowns
    document.querySelectorAll('.csel-dropdown.open').forEach(d => {
      d.classList.remove('open');
      d.previousElementSibling.classList.remove('open');
    });
    if (!isOpen) {
      dropdown.classList.add('open');
      trigger.classList.add('open');
    }
  });

  // Store reference so validation can flag it
  native._cselTrigger = trigger;

  wrap.appendChild(trigger);
  wrap.appendChild(dropdown);
  native.parentNode.insertBefore(wrap, native);
});

document.addEventListener('click', () => {
  document.querySelectorAll('.csel-dropdown.open').forEach(d => {
    d.classList.remove('open');
    d.previousElementSibling.classList.remove('open');
  });
});

// Form validation + submit
const consultForm = document.getElementById('consultForm');
if (consultForm) consultForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const form    = this;
  const msgs    = form.dataset; // translated messages come from the server-rendered form
  const errBox  = document.getElementById('formError');
  const wrap    = document.getElementById('formWrap');
  const success = document.getElementById('formSuccess');

  const required = form.querySelectorAll('input[required], select[required]');
  let errors = [];

  required.forEach(el => {
    const invalid = el.type === 'checkbox' ? !el.checked : !el.value.trim();
    if (el.tagName === 'SELECT' && el._cselTrigger) {
      el._cselTrigger.classList.toggle('error', invalid);
    } else {
      el.style.borderColor = invalid ? 'var(--red)' : '';
    }
    if (invalid) errors.push(el);
  });

  // Email format
  const emailEl = form.querySelector('#email');
  if (emailEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(emailEl.value.trim())) {
    emailEl.style.borderColor = 'var(--red)';
    if (!errors.includes(emailEl)) errors.push(emailEl);
  }

  // Phone: must contain at least 7 digits (allows spaces, dashes, +, parens)
  const phoneEl = form.querySelector('#phone');
  if (phoneEl.value.trim() && (phoneEl.value.replace(/\D/g, '').length < 7)) {
    phoneEl.style.borderColor = 'var(--red)';
    if (!errors.includes(phoneEl)) errors.push(phoneEl);
  }

  if (errors.length > 0) {
    const hasEmpty  = errors.some(el => el.type !== 'checkbox' && !el.value.trim());
    const hasCheck  = errors.some(el => el.type === 'checkbox');
    const hasBadEmail = emailEl.style.borderColor === 'var(--red)' && emailEl.value.trim();
    const hasBadPhone = phoneEl.style.borderColor === 'var(--red)' && phoneEl.value.trim();

    let msg = '';
    if (hasEmpty || hasCheck) msg = msgs.errRequired;
    if (hasBadEmail)          msg = msg ? msg : msgs.errEmail;
    if (hasBadPhone)          msg = msg ? msg + ' ' + msgs.errPhoneSuffix : msgs.errPhone;

    errBox.textContent = msg;
    errBox.style.display = 'block';
    errors[0].focus();
    return;
  }

  errBox.style.display = 'none';

  // Send the enquiry; only show the thank-you once the server has accepted it
  const button = form.querySelector('.btn-submit');
  button.disabled = true;
  let sent = false;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), lang: document.documentElement.lang }),
    });
    sent = res.ok;
  } catch { /* network failure: handled below */ }
  if (!sent) {
    button.disabled = false;
    errBox.textContent = msgs.errSend;
    errBox.style.display = 'block';
    return;
  }

  // Fade out form, show success
  wrap.style.transition = 'opacity 0.5s ease';
  wrap.style.opacity = '0';
  setTimeout(() => {
    wrap.style.display = 'none';
    success.style.display = 'block';
    success.style.opacity = '0';
    success.style.transition = 'opacity 0.6s ease';
    requestAnimationFrame(() => { success.style.opacity = '1'; });
  }, 500);
});

// Clear red border on input
if (consultForm) consultForm.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', () => { el.style.borderColor = ''; });
  el.addEventListener('change', () => { el.style.borderColor = ''; });
});
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

  function open(id) {
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
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    // Dropping the iframe is what actually stops playback
    setTimeout(() => { lb.hidden = true; frame.innerHTML = ''; }, 300);
  }

  document.addEventListener('click', e => {
    const tile = e.target.closest('.g-video');
    if (tile) { open(tile.dataset.yt); return; }
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
