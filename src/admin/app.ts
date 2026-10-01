// Admin client. Builds the editing form from src/cms/fields.ts and talks to /api/admin/*.
// Text inputs write straight into `state.content`; the DOM is only rebuilt when the
// structure changes (a list entry added, removed or moved), so typing never loses focus.
import { sections, type Field } from '../cms/fields';

type Json = Record<string, any>;
type Child = Node | string | null | undefined | false;

const state = {
  content: {} as Json,
  rev: '',
  dirty: false,
  issues: [] as { path: string; message: string }[],
};

// Which list entries are expanded. Keyed by the entry object, so it survives reordering.
const expanded = new WeakSet<object>();

const main = document.getElementById('main')!;
const saveBtn = document.getElementById('save') as HTMLButtonElement;
const statusEl = document.getElementById('status')!;

// ── DOM helper ──
function h(tag: string, attrs: Json = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, String(v));
  }
  el.append(...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false));
  return el;
}

// ── API ──
async function api(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    return { ok: false, status: 0, data: { error: 'Could not reach the server. Check your connection.' } };
  }
  if (res.status === 401) {
    location.href = '/admin/login';
    return { ok: false, status: 401, data: {} };
  }
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const sendJson = (method: string, body: unknown): RequestInit =>
  ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function toast(message: string, kind: 'ok' | 'error' = 'ok') {
  const el = h('div', { class: `toast ${kind}`, role: 'status' }, message);
  document.getElementById('toasts')!.append(el);
  setTimeout(() => el.remove(), kind === 'error' ? 7000 : 3000);
}

// ── State helpers ──
const get = (obj: Json, key: string): any => key.split('.').reduce((o: any, k) => o?.[k], obj);

function set(obj: Json, key: string, value: unknown) {
  const parts = key.split('.');
  const last = parts.pop()!;
  parts.reduce((o, k) => o[k], obj)[last] = value;
  markDirty();
}

function markDirty() {
  state.dirty = true;
  saveBtn.disabled = false;
  statusEl.textContent = 'Unsaved changes';
  statusEl.className = 'status dirty';
}

function markClean(text: string) {
  state.dirty = false;
  saveBtn.disabled = true;
  statusEl.textContent = text;
  statusEl.className = 'status';
}

const asText = (v: unknown): string =>
  typeof v === 'string' ? v : v && typeof v === 'object' ? ((v as Json).en || (v as Json).hu || '') : '';

// ── Field rendering ──
// `path` is the full path from the content root, used to show validation messages.
function renderField(field: Field, owner: Json, path: string): HTMLElement {
  const issue = state.issues.find((i) => i.path === path || i.path.startsWith(`${path}.`));
  const wrap = h('div', { class: `field${issue ? ' invalid' : ''}` });
  const id = `f-${path.replace(/\W/g, '-')}`;
  wrap.append(h('label', { class: 'field-label', for: id }, field.label));

  const value = get(owner, field.key);
  const textInput = (current: string, onChange: (v: string) => void, multi: boolean, inputId?: string, lang?: string) => {
    const el = h(multi ? 'textarea' : 'input', {
      id: inputId,
      value: current,
      lang,
      rows: multi ? Math.min(12, Math.max(2, Math.ceil(current.length / 70) + current.split('\n').length - 1)) : undefined,
      oninput: (e: Event) => onChange((e.target as HTMLInputElement).value),
    });
    if (!multi) (el as HTMLInputElement).type = 'text';
    return el;
  };

  switch (field.type) {
    case 'text':
    case 'textarea':
      wrap.append(textInput(value ?? '', (v) => set(owner, field.key, v), field.type === 'textarea', id));
      break;

    case 'ltext':
    case 'ltextarea': {
      const multi = field.type === 'ltextarea';
      wrap.append(h('div', { class: 'pair' },
        ...(['en', 'hu'] as const).map((lang, i) => h('div', { class: 'pair-col' },
          h('span', { class: 'lang-tag' }, lang.toUpperCase()),
          textInput(value?.[lang] ?? '', (v) => set(owner, `${field.key}.${lang}`, v), multi, i === 0 ? id : undefined, lang),
        )),
      ));
      break;
    }

    case 'bool':
      wrap.classList.add('field-bool');
      wrap.prepend(h('input', {
        type: 'checkbox', id, checked: Boolean(value),
        onchange: (e: Event) => set(owner, field.key, (e.target as HTMLInputElement).checked),
      }));
      break;

    case 'select':
      wrap.append(h('select', {
        id,
        onchange: (e: Event) => { set(owner, field.key, (e.target as HTMLSelectElement).value); render(); },
      }, ...field.options.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label))));
      break;

    case 'image':
    case 'video':
      wrap.append(renderMedia(field, owner, id));
      break;

    case 'list':
      wrap.classList.add('field-list');
      wrap.append(renderList(field, owner, path));
      break;
  }

  if (field.help) wrap.append(h('p', { class: 'help' }, field.help));
  if (issue) wrap.append(h('p', { class: 'issue' }, issue.message));
  return wrap;
}

function renderMedia(field: Field, owner: Json, id: string): HTMLElement {
  const value: string = get(owner, field.key) ?? '';
  const isVideo = field.type === 'video';
  const input = h('input', {
    type: 'file', id, class: 'visually-hidden',
    accept: isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/avif,image/gif',
    onchange: async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      button.textContent = 'Uploading…';
      (button as HTMLButtonElement).disabled = true;
      const body = new FormData();
      body.append('file', file);
      const res = await api('/api/admin/upload', { method: 'POST', body });
      if (!res.ok) toast(res.data.error || 'Upload failed.', 'error');
      else if ((res.data.kind === 'video') !== isVideo) toast(isVideo ? 'Choose a video file here.' : 'Choose an image file here.', 'error');
      else set(owner, field.key, res.data.url);
      render();
    },
  });
  const button = h('button', { type: 'button', class: 'btn', onclick: () => input.click() }, value ? 'Replace' : 'Upload');
  const preview = !value ? h('div', { class: 'media-empty' }, isVideo ? 'No video' : 'No image')
    : isVideo ? h('video', { src: value, muted: true, controls: true, preload: 'metadata', class: 'media-preview' })
    : h('img', { src: value, alt: '', class: 'media-preview', loading: 'lazy' });
  return h('div', { class: 'media' },
    preview,
    h('div', { class: 'media-actions' },
      input, button,
      value && h('button', { type: 'button', class: 'btn subtle', onclick: () => { set(owner, field.key, ''); render(); } }, 'Remove'),
      value && h('code', { class: 'media-path' }, value),
    ),
  );
}

function renderList(field: Extract<Field, { type: 'list' }>, owner: Json, path: string): HTMLElement {
  const items: Json[] = get(owner, field.key);
  const move = (from: number, to: number) => {
    items.splice(to, 0, ...items.splice(from, 1));
    markDirty();
    render();
  };

  const rows = items.map((item, i) => {
    const open = expanded.has(item);
    const title = asText(item[field.titleKey]) || asText(item.type) || `(${field.item} ${i + 1})`;
    const thumb = field.thumbKey && item[field.thumbKey];
    const hasIssue = state.issues.some((issue) => issue.path.startsWith(`${path}.${i}.`) || issue.path === `${path}.${i}`);
    return h('div', { class: `item${open ? ' open' : ''}${hasIssue ? ' invalid' : ''}` },
      h('div', { class: 'item-head' },
        h('button', {
          type: 'button', class: 'item-toggle', 'aria-expanded': String(open),
          onclick: () => { open ? expanded.delete(item) : expanded.add(item); render(); },
        },
          h('span', { class: 'item-num' }, String(i + 1)),
          thumb ? h('img', { src: thumb, alt: '', class: 'item-thumb', loading: 'lazy' }) : null,
          h('span', { class: 'item-title' }, title),
        ),
        h('button', { type: 'button', class: 'icon-btn', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: () => move(i, i - 1) }, '↑'),
        h('button', { type: 'button', class: 'icon-btn', title: 'Move down', 'aria-label': 'Move down', disabled: i === items.length - 1, onclick: () => move(i, i + 1) }, '↓'),
        h('button', {
          type: 'button', class: 'icon-btn danger', title: 'Delete', 'aria-label': 'Delete',
          onclick: () => {
            if (!confirm(`Delete "${title}"?`)) return;
            items.splice(i, 1);
            markDirty();
            render();
          },
        }, '✕'),
      ),
      open && h('div', { class: 'item-body' }, ...field.fields.map((f) => renderField(f, item, `${path}.${i}.${f.key}`))),
    );
  });

  return h('div', { class: 'list' },
    ...rows,
    h('button', {
      type: 'button', class: 'btn',
      onclick: () => {
        const item = structuredClone(field.blank);
        items.push(item);
        expanded.add(item);
        markDirty();
        render();
      },
    }, `+ Add ${field.item}`),
  );
}

// ── Views ──
const fmtDate = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const fmtSize = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.ceil(bytes / 1e3)} KB`);

function viewSection(id: string) {
  const section = sections.find((s) => s.id === id)!;
  main.replaceChildren(
    h('h1', {}, section.title),
    section.intro ? h('p', { class: 'intro' }, section.intro) : '',
    ...section.fields.map((f) => renderField(f, state.content, f.key)),
  );
}

async function viewMedia() {
  main.replaceChildren(h('h1', {}, 'Media'), h('p', { class: 'intro' }, 'Loading…'));
  const res = await api('/api/admin/media');
  if (!res.ok) return toast(res.data.error || 'Could not load media.', 'error');
  const files: Json[] = res.data;
  main.replaceChildren(
    h('h1', {}, 'Media'),
    h('p', { class: 'intro' }, files.length
      ? 'Everything uploaded through the admin. Files still used on the site cannot be deleted. Usage counts saved content only, so save your changes first.'
      : 'No uploads yet. Files are added here when you upload them in a content field.'),
    h('div', { class: 'media-grid' }, ...files.map((f) => h('figure', { class: 'media-card' },
      f.kind === 'image'
        ? h('img', { src: f.url, alt: '', loading: 'lazy' })
        : h('video', { src: f.url, muted: true, preload: 'metadata' }),
      h('figcaption', {},
        h('span', { class: 'media-name' }, f.name),
        h('span', {}, `${fmtSize(f.size)} · ${f.used ? 'in use' : 'not used'}`),
        !f.used && h('button', {
          type: 'button', class: 'btn subtle danger',
          onclick: async () => {
            if (!confirm(`Delete ${f.name}? This cannot be undone.`)) return;
            const del = await api(`/api/admin/media?name=${encodeURIComponent(f.name)}`, { method: 'DELETE' });
            if (!del.ok) toast(del.data.error || 'Could not delete.', 'error');
            viewMedia();
          },
        }, 'Delete'),
      ),
    ))),
  );
}

async function viewHistory() {
  main.replaceChildren(h('h1', {}, 'History'), h('p', { class: 'intro' }, 'Loading…'));
  const res = await api('/api/admin/history');
  if (!res.ok) return toast(res.data.error || 'Could not load history.', 'error');
  const versions: Json[] = res.data;
  main.replaceChildren(
    h('h1', {}, 'History'),
    h('p', { class: 'intro' }, versions.length
      ? 'Each save keeps the version it replaced. The last 30 are kept. Restoring one puts the site back to how it was just before that save; the current version is itself kept, so a restore can be undone.'
      : 'No earlier versions yet. One is kept each time you save.'),
    h('div', { class: 'history' }, ...versions.map((v) => h('div', { class: 'history-row' },
      h('span', {}, `Replaced on ${fmtDate(v.savedAt)}`),
      h('button', {
        type: 'button', class: 'btn subtle',
        onclick: async () => {
          if (state.dirty && !confirm('You have unsaved changes that will be lost. Continue?')) return;
          if (!confirm('Restore this version? The site changes immediately.')) return;
          const done = await api('/api/admin/history', sendJson('POST', { id: v.id }));
          if (!done.ok) return toast(done.data.error || 'Could not restore.', 'error');
          load(done.data);
          toast('Version restored.');
          viewHistory();
        },
      }, 'Restore'),
    ))),
    h('h2', {}, 'Backup'),
    h('p', { class: 'intro' }, 'The full backup holds everything edited or uploaded here: texts, history, photos and videos. Keep a copy somewhere safe from time to time.'),
    h('p', { class: 'backup-actions' },
      h('a', { href: '/api/admin/backup', class: 'btn primary' }, 'Download full backup'),
      h('a', { href: '/api/admin/export', class: 'btn' }, 'Texts only (JSON)'),
    ),
  );
}

const tools: Record<string, () => void> = { media: viewMedia, history: viewHistory };

function currentView(): string {
  const id = location.hash.slice(1);
  return tools[id] || sections.some((s) => s.id === id) ? id : sections[0].id;
}

function render() {
  const id = currentView();
  document.querySelectorAll<HTMLAnchorElement>('#nav a').forEach((a) => {
    a.classList.toggle('active', a.hash === `#${id}`);
    if (a.hash === `#${id}`) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const scroll = window.scrollY;
  if (tools[id]) tools[id](); else viewSection(id);
  window.scrollTo(0, scroll);
}

// ── Save / load ──
function load(data: { content: Json; rev: string }) {
  state.content = data.content;
  state.rev = data.rev;
  state.issues = [];
  markClean('All changes saved');
}

async function save() {
  if (!state.dirty) return;
  saveBtn.disabled = true;
  statusEl.textContent = 'Saving…';
  const res = await api('/api/admin/content', sendJson('PUT', { content: state.content, rev: state.rev }));
  if (res.ok) {
    load(res.data);
    toast('Saved. The site is updated.');
    render();
    return;
  }
  state.issues = res.data.issues ?? [];
  markDirty();
  if (state.issues.length) {
    // Open the list entries that hold a problem, and say where the first one is
    for (const issue of state.issues) {
      const parts = issue.path.split('.');
      parts.forEach((part, i) => {
        if (/^\d+$/.test(part)) {
          const entry = get(state.content, parts.slice(0, i + 1).join('.'));
          if (entry && typeof entry === 'object') expanded.add(entry);
        }
      });
    }
    const first = state.issues[0].path;
    const owner = sections.find((s) => s.fields.some((f) => first === f.key || first.startsWith(`${f.key}.`)));
    toast(`${state.issues.length} field${state.issues.length > 1 ? 's need' : ' needs'} fixing${owner ? ` in "${owner.title}"` : ''}.`, 'error');
    if (owner && currentView() !== owner.id) location.hash = owner.id; else render();
  } else {
    toast(res.data.error || 'Could not save.', 'error');
  }
}

// ── Boot ──
function buildNav() {
  const nav = document.getElementById('nav')!;
  const link = (id: string, title: string, extra?: Node) => h('a', { href: `#${id}` }, title, extra);
  for (const group of ['Page', 'Site'] as const) {
    nav.append(h('p', { class: 'nav-group' }, group), ...sections.filter((s) => s.group === group).map((s) => link(s.id, s.title)));
  }
  nav.append(
    h('p', { class: 'nav-group' }, 'Tools'),
    link('media', 'Media'),
    link('history', 'History'),
  );
}

async function boot() {
  buildNav();
  const res = await api('/api/admin/content');
  if (!res.ok) {
    main.replaceChildren(h('p', { class: 'intro' }, res.data.error || 'Could not load the content.'));
    return;
  }
  load(res.data);
  render();

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });
  saveBtn.addEventListener('click', save);
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', (e) => { if (state.dirty) e.preventDefault(); });
}

boot();
