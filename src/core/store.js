// Persistance locale (sur l'appareil uniquement). Aucune donnée n'est envoyée à un serveur en mode démo.
// localStorage peut être indisponible (navigation privée, stockage plein) : chaque accès est protégé.

const KEYS = {
  favorites: 'pg.favorites',
  history: 'pg.history',
  feedback: 'pg.feedback',
  draft: 'pg.draft',
  theme: 'pg.theme',
  people: 'pg.people',
};

const MAX_HISTORY = 30;
const memory = new Map(); // repli si localStorage échoue

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

function write(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on garde la valeur en mémoire pour la session */
  }
}

const listeners = new Set();
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(type) {
  for (const fn of listeners) fn(type);
}

export const favorites = {
  all() {
    return read(KEYS.favorites, []);
  },
  has(id) {
    return this.all().some((f) => f.id === id);
  },
  /** Ajoute ou retire ; renvoie true si l'élément est désormais favori. */
  toggle(snapshot) {
    const list = this.all();
    const idx = list.findIndex((f) => f.id === snapshot.id);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift({ ...snapshot, savedAt: new Date().toISOString() });
    write(KEYS.favorites, list);
    emit('favorites');
    return idx < 0;
  },
  remove(id) {
    write(KEYS.favorites, this.all().filter((f) => f.id !== id));
    emit('favorites');
  },
  patch(id, patch) {
    write(KEYS.favorites, this.all().map((f) => (f.id === id ? { ...f, ...patch } : f)));
    emit('favorites');
  },
};

export const history = {
  all() {
    return read(KEYS.history, []);
  },
  get(id) {
    return this.all().find((s) => s.id === id) || null;
  },
  save(search) {
    const list = this.all().filter((s) => s.id !== search.id);
    list.unshift(search);
    write(KEYS.history, list.slice(0, MAX_HISTORY));
    emit('history');
    return search;
  },
  update(id, patch) {
    const list = this.all();
    const idx = list.findIndex((s) => s.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() };
    write(KEYS.history, list);
    emit('history');
    return list[idx];
  },
  remove(id) {
    write(KEYS.history, this.all().filter((s) => s.id !== id));
    emit('history');
  },
};

/** Proches : profil réutilisable (réponses), date d'anniversaire, cadeaux déjà offerts. */
export const people = {
  all() {
    return read(KEYS.people, []);
  },
  get(id) {
    return this.all().find((p) => p.id === id) || null;
  },
  save(person) {
    const list = this.all();
    const idx = list.findIndex((p) => p.id === person.id);
    const next = { given: [], ...person, updatedAt: new Date().toISOString() };
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push({ createdAt: next.updatedAt, ...next });
    list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    write(KEYS.people, list);
    emit('people');
    return this.get(person.id);
  },
  remove(id) {
    write(KEYS.people, this.all().filter((p) => p.id !== id));
    emit('people');
  },
  /** Cadeau offert : il ne sera plus proposé à cette personne. */
  setGiven(id, gift, given = true) {
    const p = this.get(id);
    if (!p) return null;
    const list = (p.given || []).filter((g) => g.id !== gift.id);
    if (given) list.unshift({ id: gift.id, t: gift.t, ic: gift.ic, at: new Date().toISOString() });
    return this.save({ ...p, given: list });
  },
};

export const draft = {
  get() {
    return read(KEYS.draft, null);
  },
  set(value) {
    write(KEYS.draft, value);
  },
  clear() {
    write(KEYS.draft, null);
  },
};

export const feedback = {
  add(entry) {
    const list = read(KEYS.feedback, []);
    list.unshift({ ...entry, at: new Date().toISOString() });
    write(KEYS.feedback, list.slice(0, 200));
  },
  forSearch(searchId) {
    return read(KEYS.feedback, []).find((f) => f.searchId === searchId && f.kind === 'rating') || null;
  },
};

export const theme = {
  get() {
    return read(KEYS.theme, 'auto');
  },
  set(value) {
    write(KEYS.theme, value);
    applyTheme(value);
  },
};

export function applyTheme(value) {
  const root = document.documentElement;
  if (value === 'light' || value === 'dark') root.dataset.theme = value;
  else delete root.dataset.theme;
  // Couleur de la barre d'état / du navigateur assortie au thème choisi
  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((m) => {
    if (!m.dataset.auto) m.dataset.auto = m.getAttribute('content');
    const forced = value === 'dark' ? '#120C1C' : value === 'light' ? '#FBF6EF' : null;
    m.setAttribute('content', forced || m.dataset.auto);
  });
}

export function uid(prefix = 's') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
