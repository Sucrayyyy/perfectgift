// Feuilles coulissantes (bottom sheets) et toasts.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { animate, EASE } from '../../core/motion.js';

let openCount = 0;
const openSheets = new Set();

/** Ferme toutes les feuilles ouvertes (appelé à chaque changement d'écran). */
export function closeAllSheets() {
  for (const close of [...openSheets]) close();
}

export function openSheet({ title, body, footer, onClose }) {
  const layer = document.getElementById('layer');
  let closed = false;
  let startY = null;
  let dy = 0;

  const close = async () => {
    if (closed) return;
    closed = true;
    openSheets.delete(close);
    document.removeEventListener('keydown', onKey);
    await Promise.all([
      animate(backdrop, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, keep: true }),
      animate(panel, [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(105%)' }], { duration: 320, easing: EASE.inOut, keep: true }),
    ]);
    root.remove();
    if (--openCount === 0) {
      document.documentElement.style.overflow = '';
      document.body.classList.remove('has-sheet');
    }
    onClose?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();

  const backdrop = h('div', { class: 'sheet__backdrop', onclick: close });
  const grab = h('div', { class: 'sheet__grab' }, h('div', { class: 'sheet__handle' }));
  const head = h('div', { class: 'sheet__head' },
    h('h2', { class: 'sheet__title' }, title),
    h('button', { type: 'button', class: 'btn btn--icon btn--sm', 'aria-label': 'Fermer', onclick: close }, icon('x')),
  );
  const panel = h('div', { class: 'sheet__panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    grab, head,
    h('div', { class: 'sheet__body', tabindex: '-1' }, body),
    footer ? h('div', { class: 'sheet__foot' }, footer) : null,
  );
  const root = h('div', { class: 'sheet' }, backdrop, panel);

  // Glisser vers le bas pour fermer
  const down = (e) => {
    if (e.target.closest('button')) return;
    startY = e.clientY;
    dy = 0;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (startY == null) return;
    dy = Math.max(0, e.clientY - startY);
    panel.style.transform = `translateY(${dy}px)`;
  };
  const up = () => {
    if (startY == null) return;
    startY = null;
    if (dy > 110) {
      close();
      return;
    }
    const from = dy;
    panel.style.transform = '';
    dy = 0;
    animate(panel, [{ transform: `translateY(${from}px)` }, { transform: 'translateY(0)' }], { duration: 380, easing: EASE.spring });
  };
  for (const zone of [grab, head]) {
    zone.addEventListener('pointerdown', down);
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', up);
    zone.addEventListener('pointercancel', up);
  }

  layer.append(root);
  openSheets.add(close);
  openCount++;
  document.documentElement.style.overflow = 'hidden';
  document.body.classList.add('has-sheet');
  document.addEventListener('keydown', onKey);
  animate(backdrop, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 });
  animate(panel, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 520, easing: EASE.out });
  setTimeout(() => panel.querySelector('.sheet__body')?.focus?.(), 50);

  return { close, panel };
}

let toastBox = null;

export function toast(message, { action, onAction, duration = 3200 } = {}) {
  if (!toastBox) {
    toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastBox);
  }
  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    animate(el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.97)' }], { duration: 220, keep: true })
      .then(() => el.remove());
  };
  const el = h('div', { class: 'toast' },
    h('span', null, message),
    action ? h('button', { type: 'button', class: 'toast__action', onclick: () => { onAction?.(); dismiss(); } }, action) : null,
  );
  toastBox.append(el);
  animate(el, [{ opacity: 0, transform: 'translateY(18px) scale(.95)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE.spring });
  const timer = setTimeout(dismiss, duration);
  return dismiss;
}
