// Identité PerfectGift : symbole (un cadeau dont le nœud est une étoile), logotype et illustrations animées.
import { h } from '../../core/dom.js';

let uid = 0;
const STAR = (cx, cy, r) => {
  const k = r * 0.09;
  const j = r * 0.61;
  return `M${cx} ${cy - r}C${cx + k} ${cy - j} ${cx + j} ${cy - k} ${cx + r} ${cy}C${cx + j} ${cy + k} ${cx + k} ${cy + j} ${cx} ${cy + r}C${cx - k} ${cy + j} ${cx - j} ${cy + k} ${cx - r} ${cy}C${cx - j} ${cy - k} ${cx - k} ${cy - j} ${cx} ${cy - r}Z`;
};

function defs(id) {
  return `<defs>
    <linearGradient id="r${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8A5B"/><stop offset=".5" stop-color="#E9483A"/><stop offset="1" stop-color="#C2285F"/></linearGradient>
    <linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF9A6B"/><stop offset=".55" stop-color="#F0533F"/><stop offset="1" stop-color="#D23466"/></linearGradient>
    <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE29A"/><stop offset=".5" stop-color="#F2B544"/><stop offset="1" stop-color="#E0951C"/></linearGradient>
  </defs>`;
}

export function markSvg() {
  const id = `pg${++uid}`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs(id)}
    <rect x="9" y="27" width="46" height="31" rx="9" fill="url(#r${id})"/>
    <rect x="9" y="31" width="46" height="3.5" fill="#2B1846" opacity=".14"/>
    <rect x="5" y="19" width="54" height="13" rx="6.5" fill="url(#l${id})"/>
    <rect x="28" y="19" width="8" height="39" fill="#FFF4E8"/>
    <path d="${STAR(32, 10.5, 10)}" fill="url(#g${id})"/>
  </svg>`;
}

export function logo({ size = 34, word = true } = {}) {
  return h('span', { class: 'logo', 'aria-label': 'PerfectGift' },
    h('span', { class: 'logo__mark', style: { width: `${size}px`, height: `${size}px` }, html: markSvg() }),
    word && h('span', { class: 'logo__word', html: 'Perfect<i>Gift</i>' }),
  );
}

/** Grande illustration de l'accueil : couvercle qui flotte, étoile qui pulse, étincelles. */
export function heroGift() {
  const id = `pg${++uid}`;
  const sparks = [[38, 62, 9], [196, 74, 7], [26, 150, 6], [204, 158, 10]]
    .map(([x, y, r]) => `<path class="g-spark" d="${STAR(x, y, r)}" fill="url(#g${id})"/>`).join('');
  const el = h('div', { class: 'hero__art' });
  el.innerHTML = `<svg class="gift-hero" viewBox="0 0 230 230" aria-hidden="true">${defs(id)}
    <circle class="g-ring" cx="115" cy="120" r="104" fill="none" stroke="currentColor" stroke-opacity=".12" stroke-width="1.5" stroke-dasharray="3 9"/>
    <ellipse class="g-shadow" cx="115" cy="214" rx="72" ry="9" fill="#2B1846" opacity=".13"/>
    <g class="g-body">
      <rect x="45" y="104" width="140" height="102" rx="24" fill="url(#r${id})"/>
      <rect x="45" y="112" width="140" height="8" fill="#2B1846" opacity=".12"/>
      <rect x="56" y="124" width="10" height="66" rx="5" fill="#fff" opacity=".18"/>
      <rect x="103" y="104" width="24" height="102" fill="#FFF4E8"/>
    </g>
    <g class="g-lid">
      <rect x="31" y="78" width="168" height="38" rx="17" fill="url(#l${id})"/>
      <rect x="44" y="84" width="60" height="7" rx="3.5" fill="#fff" opacity=".22"/>
      <rect x="103" y="78" width="24" height="38" fill="#FFF4E8"/>
      <path class="g-star" d="${STAR(115, 47, 32)}" fill="url(#g${id})"/>
      <path d="${STAR(108, 40, 6)}" fill="#fff" opacity=".55"/>
    </g>
    ${sparks}
  </svg>`;
  const colors = ['#E9483A', '#F2B544', '#FF8A5B', '#6A48F5', '#1C8A6E'];
  for (let i = 0; i < 10; i++) {
    el.append(h('span', {
      class: 'confetti',
      style: {
        background: colors[i % colors.length],
        '--dx': `${(i % 2 ? 1 : -1) * (30 + ((i * 37) % 90))}px`,
        '--rot': `${120 + i * 40}deg`,
        animationDelay: `${(i * 0.37).toFixed(2)}s`,
        left: `${40 + ((i * 13) % 20)}%`,
      },
    }));
  }
  return el;
}

/** Cadeau de l'écran de recherche : il tremble, puis s'ouvre dans un éclat de lumière. */
export function searchingGift() {
  const id = `pg${++uid}`;
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const x1 = 75 + Math.cos(a - 0.12) * 70;
    const y1 = 62 + Math.sin(a - 0.12) * 70;
    const x2 = 75 + Math.cos(a + 0.12) * 70;
    const y2 = 62 + Math.sin(a + 0.12) * 70;
    return `<path d="M75 62L${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}Z" fill="url(#g${id})" opacity=".45"/>`;
  }).join('');
  return h('div', { class: 'searching__gift', html: `<svg viewBox="0 0 150 150" width="100%" height="100%" aria-hidden="true">${defs(id)}
    <g class="g-rays">${rays}</g>
    <g class="g-box">
      <rect x="25" y="72" width="100" height="70" rx="17" fill="url(#r${id})"/>
      <rect x="25" y="78" width="100" height="6" fill="#2B1846" opacity=".13"/>
      <rect x="67" y="72" width="16" height="70" fill="#FFF4E8"/>
      <g class="g-lid">
        <rect x="15" y="52" width="120" height="26" rx="12" fill="url(#l${id})"/>
        <rect x="67" y="52" width="16" height="26" fill="#FFF4E8"/>
        <path d="${STAR(75, 31, 20)}" fill="url(#g${id})"/>
      </g>
    </g>
  </svg>` });
}

/** Petite boîte vide pour les états sans contenu. */
export function emptyGift() {
  const id = `pg${++uid}`;
  return h('div', { class: 'empty__art float', html: `<svg viewBox="0 0 120 120" aria-hidden="true">${defs(id)}
    <ellipse cx="60" cy="108" rx="34" ry="5" fill="#2B1846" opacity=".1"/>
    <rect x="24" y="52" width="72" height="50" rx="14" fill="url(#r${id})" opacity=".9"/>
    <rect x="54" y="52" width="12" height="50" fill="#FFF4E8"/>
    <g transform="rotate(-16 22 46)"><rect x="16" y="34" width="88" height="20" rx="10" fill="url(#l${id})"/><rect x="54" y="34" width="12" height="20" fill="#FFF4E8"/></g>
    <path d="${STAR(88, 20, 9)}" fill="url(#g${id})"/>
  </svg>` });
}
