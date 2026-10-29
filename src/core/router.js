// Routeur par hash (compatible GitHub Pages, aucune réécriture d'URL côté serveur nécessaire).
// Les écrans renvoient { el, mount?, cleanup?, tab? } ; les transitions utilisent la View Transitions API
// quand elle existe (Safari 18+), sinon une animation WAAPI équivalente.
import { animate, reducedMotion, EASE } from './motion.js';

const routes = [];
const stack = [];
const scrollPositions = new Map();
const listeners = new Set();
let current = null;
let currentPath = null;
let pending = null;

export function route(pattern, render) {
  const keys = [];
  const re = new RegExp(
    '^' + pattern.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    }) + '/?$'
  );
  routes.push({ re, keys, render });
}

export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function navigate(path, { replace = false, dir = null } = {}) {
  pending = { dir, replace };
  const hash = '#' + path;
  if (location.hash === hash) {
    handleChange();
  } else if (replace) {
    history.replaceState(null, '', hash);
    handleChange();
  } else {
    location.hash = hash;
  }
}

export function back(fallback = '/') {
  if (stack.length > 1) history.back();
  else navigate(fallback, { replace: true, dir: 'back' });
}

export function start() {
  addEventListener('hashchange', handleChange);
  handleChange();
}

function readPath() {
  return decodeURI(location.hash.slice(1)) || '/';
}

function handleChange() {
  const path = readPath();
  const opts = pending || {};
  pending = null;

  let dir = opts.dir;
  if (!dir) dir = stack.length >= 2 && stack[stack.length - 2] === path ? 'back' : 'forward';
  if (currentPath === null) dir = 'none';

  if (dir === 'back' && stack[stack.length - 2] === path) stack.pop();
  else if (opts.replace && stack.length) stack[stack.length - 1] = path;
  else if (stack[stack.length - 1] !== path) stack.push(path);

  render(path, dir);
}

function render(path, dir) {
  let params = {};
  const match = routes.find((r) => {
    const m = path.match(r.re);
    if (!m) return false;
    params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    return true;
  });
  if (!match) {
    navigate('/', { replace: true, dir: 'fade' });
    return;
  }

  const outlet = document.getElementById('view');
  if (currentPath) scrollPositions.set(currentPath, scrollY);

  const swap = () => {
    try {
      current?.cleanup?.();
    } catch (err) {
      console.error(err);
    }
    const screen = match.render(params, { path, dir });
    outlet.replaceChildren(screen.el);
    const y = dir === 'back' ? scrollPositions.get(path) || 0 : 0;
    scrollTo(0, y);
    current = screen;
    currentPath = path;
    for (const fn of listeners) fn({ path, tab: screen.tab });
    screen.mount?.();
  };

  const canVT = typeof document.startViewTransition === 'function' && !reducedMotion() && dir !== 'none';
  if (canVT) {
    const root = document.documentElement;
    root.dataset.dir = dir;
    const t = document.startViewTransition(swap);
    // Une transition peut être abandonnée (onglet masqué, navigation rapide) : le changement d'écran a lieu quand même.
    t.ready.catch(() => {});
    t.updateCallbackDone.catch((err) => console.error(err));
    t.finished.catch(() => {}).finally(() => delete root.dataset.dir);
  } else {
    swap();
    if (dir !== 'none') {
      const from = dir === 'back' ? 'translateX(-18%)' : dir === 'fade' ? 'scale(.985)' : 'translateX(18%)';
      animate(outlet.firstElementChild, [
        { opacity: 0, transform: from },
        { opacity: 1, transform: 'none' },
      ], { duration: 380, easing: EASE.out });
    }
  }
}
