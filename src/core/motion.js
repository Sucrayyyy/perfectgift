// Motion design : petites primitives au-dessus de la Web Animations API.
// Toutes respectent « réduire les animations » (iOS : Réglages › Accessibilité › Mouvement).

export const EASE = {
  out: 'cubic-bezier(.22, 1, .36, 1)',
  spring: 'cubic-bezier(.34, 1.56, .64, 1)',
  inOut: 'cubic-bezier(.65, 0, .35, 1)',
};

export function reducedMotion() {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Anime puis retire l'effet (l'état final doit correspondre au style naturel de l'élément). */
export function animate(el, keyframes, opts = {}) {
  if (!el || typeof el.animate !== 'function') return Promise.resolve();
  const { keep = false, ...rest } = opts;
  const timing = {
    duration: 420,
    easing: EASE.out,
    fill: 'both',
    ...rest,
    ...(reducedMotion() ? { duration: 1, delay: 0 } : {}),
  };
  const anim = el.animate(keyframes, timing);
  // Filet de sécurité : si l'onglet est en arrière-plan, les animations peuvent être gelées ;
  // on ne bloque jamais l'interface en attendant leur fin.
  const deadline = new Promise((resolve) => setTimeout(resolve, timing.duration + (timing.delay || 0) + 120));
  return Promise.race([anim.finished, deadline])
    .then(() => {
      if (keep) anim.finish();
      else anim.cancel();
    })
    .catch(() => {});
}

export const UNWRAP = [
  { opacity: 0, transform: 'translateY(22px) scale(.98)', filter: 'blur(6px)' },
  { opacity: 1, transform: 'none', filter: 'blur(0)' },
];
export const RISE = [
  { opacity: 0, transform: 'translateY(14px)' },
  { opacity: 1, transform: 'none' },
];
export const POP_IN = [
  { opacity: 0, transform: 'scale(.6)' },
  { opacity: 1, transform: 'scale(1)' },
];

export function stagger(els, keyframes = RISE, { step = 55, delay = 0, duration = 520, easing = EASE.out } = {}) {
  return Promise.all([...els].map((el, i) => animate(el, keyframes, { delay: delay + i * step, duration, easing })));
}

export function pop(el, scale = 1.08) {
  return animate(el, [
    { transform: 'scale(1)' },
    { transform: 'scale(.9)', offset: 0.3 },
    { transform: `scale(${scale})`, offset: 0.65 },
    { transform: 'scale(1)' },
  ], { duration: 460, easing: 'ease-out' });
}

export function shakeX(el) {
  return animate(el, [
    { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
  ], { duration: 420, easing: 'ease-out' });
}

/** Petite gerbe de particules (cœurs, étoiles…) depuis le centre d'un élément. */
export function burst(el, { colors = ['#E9483A', '#F2B544', '#FF8A5B', '#C2285F'], count = 14, spread = 70 } = {}) {
  if (reducedMotion() || !el) return;
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = spread * (0.6 + Math.random() * 0.6);
    const size = 5 + Math.random() * 5;
    Object.assign(p.style, {
      position: 'fixed', left: `${cx}px`, top: `${cy}px`, zIndex: 90, pointerEvents: 'none',
      width: `${size}px`, height: `${size}px`, borderRadius: i % 3 ? '50%' : '2px',
      background: colors[i % colors.length], transform: 'translate(-50%, -50%)',
    });
    document.body.append(p);
    p.animate([
      { transform: 'translate(-50%, -50%) scale(.4)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(1) rotate(${Math.random() * 120 - 60}deg)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 300, easing: EASE.out, fill: 'forwards' }).finished.finally(() => p.remove());
  }
}

/** Replie un élément (hauteur → 0) avant de le retirer : les voisins glissent naturellement. */
export async function collapse(el, { direction = 1 } = {}) {
  if (!el) return;
  const h = el.getBoundingClientRect().height;
  el.style.overflow = 'hidden';
  await animate(el, [
    { transform: 'translateX(0) rotate(0)', opacity: 1 },
    { transform: `translateX(${direction * 110}%) rotate(${direction * 8}deg)`, opacity: 0 },
  ], { duration: 380, easing: EASE.inOut, keep: true });
  await animate(el, [
    { height: `${h}px`, marginTop: getComputedStyle(el).marginTop },
    { height: '0px', marginTop: '-18px' },
  ], { duration: 320, easing: EASE.out, keep: true });
}

/** Compteur animé (prix, pourcentages). */
export function countUp(el, to, { from = 0, duration = 900, format = (v) => Math.round(v) } = {}) {
  if (reducedMotion()) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Observe l'arrivée d'éléments à l'écran pour les animer une seule fois. */
export function revealOnScroll(els, onReveal) {
  if (!('IntersectionObserver' in window) || reducedMotion()) {
    els.forEach((el) => onReveal(el));
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.unobserve(entry.target);
        onReveal(entry.target);
      }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
