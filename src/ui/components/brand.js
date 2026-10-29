// Identité PerfectGift : un cadeau noué d'un vrai ruban. Aplats, pas d'étoiles ni de halos.
import { h } from '../../core/dom.js';

// Nœud dessiné dans un repère 64×64, centré sur (32, cy)
const bow = (cy, fill, knot) => `
  <path d="M32 ${cy}c-2.6-2.6-9.5-5.1-11.4-2.6-1.85 2.6 1.9 5.6 11.4 2.6Z" fill="${fill}"/>
  <path d="M32 ${cy}c2.6-2.6 9.5-5.1 11.4-2.6 1.85 2.6-1.9 5.6-11.4 2.6Z" fill="${fill}"/>
  <rect x="28.3" y="${cy - 2.7}" width="7.4" height="6" rx="2" fill="${knot}"/>`;

export function markSvg() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="9" y="28" width="46" height="30" rx="7" fill="#E9483A"/>
    <rect x="5" y="20" width="54" height="12" rx="5" fill="#C93A2E"/>
    <rect x="28" y="20" width="8" height="38" fill="#FFF4E8"/>
    ${bow(20, '#F2B544', '#D99418')}
  </svg>`;
}

export function logo({ size = 32, word = true } = {}) {
  return h('span', { class: 'logo', 'aria-label': 'PerfectGift' },
    h('span', { class: 'logo__mark', style: { width: `${size}px`, height: `${size}px` }, html: markSvg() }),
    word && h('span', { class: 'logo__word', html: 'Perfect<span>Gift</span>' }),
  );
}

/**
 * Recherche : on emballe le cadeau. Le couvercle se pose, le ruban s'enroule, le nœud se forme.
 * La boucle tourne tant que le moteur travaille ; `.is-done` fige le paquet terminé.
 */
export function searchingGift() {
  return h('div', { class: 'wrap-anim', html: `<svg viewBox="0 0 160 160" width="100%" height="100%" aria-hidden="true">
    <ellipse class="w-shadow" cx="80" cy="146" rx="52" ry="6"/>
    <g class="w-box">
      <rect class="w-body" x="30" y="66" width="100" height="72" rx="10"/>
      <line class="w-rib w-rib--h" x1="30" y1="102" x2="130" y2="102"/>
      <line class="w-rib w-rib--v" x1="80" y1="66" x2="80" y2="138"/>
    </g>
    <g class="w-lid">
      <rect class="w-lidbox" x="24" y="52" width="112" height="20" rx="6"/>
      <line class="w-rib w-rib--l" x1="80" y1="52" x2="80" y2="72"/>
    </g>
    <g class="w-bow">
      <path d="M80 52c-8.1-8.1-29.3-15.8-35.1-8.1-5.8 8.1 5.8 17.4 35.1 8.1Z"/>
      <path d="M80 52c8.1-8.1 29.3-15.8 35.1-8.1 5.8 8.1-5.8 17.4-35.1 8.1Z"/>
      <rect x="74" y="46.5" width="12" height="11" rx="4"/>
    </g>
  </svg>` });
}

/** Petite boîte entrouverte pour les états sans contenu. */
export function emptyGift() {
  return h('div', { class: 'empty__art', html: `<svg viewBox="0 0 120 120" aria-hidden="true">
    <ellipse cx="60" cy="108" rx="34" ry="5" fill="#2B1846" fill-opacity=".08"/>
    <rect x="24" y="52" width="72" height="50" rx="11" fill="#E9483A"/>
    <rect x="54" y="52" width="12" height="50" fill="#FFF4E8"/>
    <g transform="rotate(-14 20 46)"><rect x="16" y="34" width="88" height="18" rx="7" fill="#C93A2E"/><rect x="54" y="34" width="12" height="18" fill="#FFF4E8"/></g>
  </svg>` });
}

/** Étiquette cadeau de l'accueil : « À : … / De : moi », suspendue à sa ficelle. */
export function giftTag(input) {
  return h('div', { class: 'tag' },
    h('span', { class: 'tag__string', html: '<svg viewBox="0 0 50 30" aria-hidden="true"><path d="M48 30C36 26 30 8 2 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' }),
    h('div', { class: 'tag__card' },
      h('span', { class: 'tag__hole' }),
      h('label', { class: 'tag__row' }, h('span', { class: 'tag__key' }, 'À'), input),
      h('div', { class: 'tag__row tag__row--from' }, h('span', { class: 'tag__key' }, 'De'), h('span', { class: 'tag__from' }, 'moi')),
    ),
  );
}
