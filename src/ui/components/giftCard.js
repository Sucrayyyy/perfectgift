// Carte cadeau (résultats) + feuille « où l'acheter ».
import { h, formatRange, formatPrice, formatDate, frenchSpacing } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, pop, burst, countUp, UNWRAP, EASE } from '../../core/motion.js';
import { favorites } from '../../core/store.js';
import { GIFT_TYPES } from '../../domain/options.js';
import { purchaseLinks, DATA_MODE } from '../../services/recommendations.js';
import { openSheet, toast } from './overlay.js';
import { shareContent } from './share.js';
import { giftArt, ideaIcon, hueFor } from './art.js';

export const MODE_META = {
  safe: { name: 'SAFE', label: 'Valeur sûre', group: 'Les valeurs sûres' },
  perfect: { name: 'PERFECT', label: 'Le cadeau idéal', group: 'Les cadeaux idéaux' },
  extra: { name: 'EXTRA', label: 'Inattendu', group: 'Les idées inattendues' },
};
const ORIGINALITY = ['', 'Classique', 'Sûr', 'Original', 'Audacieux', 'Inattendu'];

/** Instantané stocké dans les favoris (indépendant des évolutions du catalogue). */
export function snapshot(c, searchId) {
  const offer = c.offers?.[0];
  return {
    id: c.idea.id,
    ic: ideaIcon(c.idea),
    t: c.idea.t,
    d: c.idea.d,
    y: c.idea.y,
    o: c.idea.o,
    mode: c.mode,
    relevance: c.relevance,
    why: c.why,
    hue: hueFor(c.idea),
    price: offer ? [offer.price, offer.price] : c.price.range,
    verified: !!offer,
    links: purchaseLinks(c).map(({ id, name, url, type, price, merchant, short, icon: ic, tone, kind }) => ({ id, name: name || merchant, url, type, price, short, icon: ic, tone, kind })),
    searchId,
  };
}

function perPerson(range, participants) {
  if (!participants || participants < 2) return null;
  const [a, b] = range.map((v) => Math.max(1, Math.round(v / participants)));
  return h('span', { class: 'subtle' }, a === b ? `soit ≈ ${a}\u00a0€ chacun` : `soit ≈ ${a}–${b}\u00a0€ chacun`);
}

function priceBlock(c, participants) {
  const offer = c.offers?.[0];
  if (offer) {
    return h('div', { class: 'gcard__price' },
      h('span', { class: 'gcard__amount' }, formatPrice(offer.price)),
      h('span', { class: 'pill pill--ok' }, icon('check'), 'Prix vérifié'),
      h('span', { class: 'subtle' }, `chez ${offer.merchant}`),
      perPerson([offer.price, offer.price], participants),
    );
  }
  return h('div', { class: 'gcard__price' },
    h('span', { class: 'gcard__amount' }, `≈ ${formatRange(c.price.range)}`),
    c.price.over
      ? h('span', { class: 'pill pill--demo' }, 'Hors budget')
      : h('span', { class: 'pill pill--demo', title: 'Fourchette indicative, non vérifiée en temps réel' }, 'Prix indicatif'),
    c.price.clipped ? h('span', { class: 'subtle' }, 'versions dans votre budget') : null,
    perPerson(c.price.range, participants),
  );
}

export function giftCard(c, { searchId, rank, onReject, participants = 1, showMode = true }) {
  const { idea } = c;
  const [a, b, cc] = hueFor(idea);
  const type = GIFT_TYPES[idea.y];
  const offer = c.offers?.[0];
  const merchants = offer ? [offer.merchant] : purchaseLinks(c).filter((l) => l.id !== 'gshop' && l.id !== 'experiences').map((l) => l.name).slice(0, 3);

  const favBtn = h('button', {
    type: 'button',
    class: ['gcard__fav', favorites.has(idea.id) && 'is-on'],
    'aria-label': 'Ajouter aux favoris',
    'aria-pressed': String(favorites.has(idea.id)),
    html: iconSvg('heart'),
  });
  favBtn.addEventListener('click', () => {
    const on = favorites.toggle(snapshot(c, searchId));
    favBtn.classList.toggle('is-on', on);
    favBtn.setAttribute('aria-pressed', String(on));
    pop(favBtn, 1.18);
    if (on) {
      burst(favBtn);
      toast('Ajouté aux favoris');
    }
  });

  const meterFill = h('span');
  const meterValue = h('b', null, '0 %');
  const dots = Array.from({ length: 5 }, (_, i) => h('i', { class: i < idea.o ? 'on' : '' }));

  const card = h('article', { class: 'gcard enter', dataset: { mode: c.mode, id: idea.id } },
    h('div', { class: 'gcard__art', style: { '--a': a, '--b': b, '--c': cc } },
      offer?.image
        ? h('img', { src: offer.image, alt: '', loading: 'lazy', style: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } })
        : giftArt(ideaIcon(idea)),
      h('div', { class: 'gcard__badges' },
        h('span', { class: 'pill pill--glass' }, icon(type.icon), type.l),
        showMode ? h('span', { class: `pill pill--${c.mode}` }, MODE_META[c.mode].name) : null,
      ),
      favBtn,
      rank ? h('span', { class: 'gcard__rank' }, `N° ${rank}`) : null,
      offer?.image ? null : h('span', { class: 'gcard__illus' }, 'Visuel illustratif'),
    ),
    h('div', { class: 'gcard__body' },
      merchants.length ? h('div', { class: 'gcard__meta' }, ...merchants.flatMap((m, i) => (i ? [h('span', { class: 'sep' }), m] : [m]))) : null,
      h('h3', { class: 'gcard__title' }, offer?.title || idea.t),
      priceBlock(c, participants),
      h('p', { class: 'gcard__desc' }, frenchSpacing(idea.d)),
      h('div', { class: 'why' },
        h('div', { class: 'why__label' }, icon('tag'), 'Pourquoi ce cadeau ?'),
        h('p', null, frenchSpacing(c.why)),
      ),
      h('div', { class: 'scores' },
        h('div', { class: 'meter' },
          h('div', { class: 'meter__head' }, h('span', null, 'Pertinence estimée'), meterValue),
          h('div', { class: 'meter__bar' }, meterFill),
        ),
        h('div', { class: 'dots' },
          h('div', { class: 'dots__head' }, h('span', null, 'Originalité'), h('span', null, ORIGINALITY[idea.o])),
          h('div', { class: 'dots__row', 'aria-label': `Originalité ${idea.o} sur 5` }, dots),
        ),
      ),
      h('div', { class: 'gcard__actions' },
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => openWhere(c) }, icon('bag'), offer ? 'Acheter le cadeau' : 'Voir le cadeau'),
        h('button', { type: 'button', class: 'btn btn--soft btn--sm gcard__nope', 'aria-label': 'Ce cadeau ne convient pas', onclick: () => onReject?.(c, card) }, icon('thumbs-down'), 'Ne convient pas'),
      ),
    ),
  );

  card.reveal = () => {
    card.classList.remove('enter');
    animate(card, UNWRAP, { duration: 640, easing: EASE.out });
    const art = card.querySelector('.art-badge');
    if (art) animate(art, [{ transform: 'scale(.5) rotate(-24deg)', opacity: 0 }, { transform: 'scale(1) rotate(-6deg)', opacity: 1 }], { duration: 820, delay: 120, easing: EASE.spring });
    setTimeout(() => {
      meterFill.style.width = `${c.relevance}%`;
      countUp(meterValue, c.relevance, { duration: 1000, format: (v) => `${Math.round(v)} %` });
      dots.forEach((d, i) => d.classList.contains('on') && animate(d, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 420, delay: 80 * i, easing: EASE.spring }));
    }, 260);
  };
  return card;
}

/** Feuille « Où l'acheter ? » : offres vérifiées ou recherches chez les marchands (mode démo). */
export function openWhere(c, extraNotes = []) {
  const links = purchaseLinks(c);
  const offers = links.filter((l) => l.type === 'offer');
  const body = h('div', { class: 'stack' },
    offers.length
      ? h('p', { class: 'muted' }, 'Offres vérifiées auprès des marchands. Le prix peut évoluer : il est confirmé sur la page du vendeur.')
      : h('div', { class: 'note' }, icon('info'), h('div', null,
        h('strong', null, 'Mode démo. '),
        'Ces liens ouvrent une recherche chez le marchand. Une fois une source marchande connectée, ils mèneront à la fiche exacte du produit, avec prix et stock vérifiés.',
      )),
    ...extraNotes.map((n) => h('div', { class: 'note' }, icon('info'), h('div', null, n))),
    h('div', null, links.map((l) => merchantRow(l))),
    h('p', { class: 'subtle' }, offers.some((o) => o.affiliate)
      ? 'Certains liens sont des liens partenaires : PerfectGift peut percevoir une commission, sans surcoût pour vous.'
      : 'Liens non affiliés : PerfectGift ne perçoit aucune commission.'),
  );
  const shareBtn = h('button', { type: 'button', class: 'btn btn--soft btn--block' }, icon('share'), 'Partager cette idée');
  shareBtn.addEventListener('click', () => shareContent({
    title: c.idea.t,
    text: `Idée cadeau : ${c.idea.t} (≈ ${formatRange(c.price.range)}). ${c.why}`,
  }));
  openSheet({ title: c.idea.t, body, footer: shareBtn });
}

export function merchantRow(l) {
  const isOffer = l.type === 'offer';
  return h('a', { class: 'merchant', href: l.url, target: '_blank', rel: 'noopener noreferrer' },
    h('span', { class: 'merchant__logo', style: { background: l.tone || '#2B1846' } }, l.icon ? icon(l.icon) : l.short || (l.merchant || '?').slice(0, 2)),
    h('span', { class: 'merchant__text' },
      h('b', null, isOffer ? `${formatPrice(l.price)} · ${l.merchant}` : l.name),
      h('span', null, isOffer
        ? `${l.availability === 'in_stock' ? 'En stock' : 'Disponibilité à confirmer'} · vérifié ${formatDate(l.checkedAt)}${l.affiliate ? ' · lien partenaire' : ''}`
        : `${l.kind || 'Recherche'} · ouvrir la recherche`),
    ),
    icon('external'),
  );
}

export function demoInfo() {
  openSheet({
    title: DATA_MODE === 'live' ? 'Sources des offres' : 'Mode démo',
    body: h('div', { class: 'stack' },
      h('p', null, 'PerfectGift fonctionne actuellement avec un ', h('strong', null, 'catalogue de démonstration'), ' : des idées de cadeaux qui existent réellement dans le commerce, classées par notre moteur selon vos réponses.'),
      h('ul', { class: 'stack', style: { paddingLeft: '18px', listStyle: 'disc' } },
        h('li', null, 'Les prix affichés sont des ', h('strong', null, 'fourchettes indicatives'), ', pas des prix en temps réel.'),
        h('li', null, 'La disponibilité n’est pas vérifiée.'),
        h('li', null, 'Les boutons ouvrent une recherche chez les marchands, jamais une fausse fiche produit.'),
        h('li', null, 'Les visuels sont illustratifs.'),
      ),
      h('p', null, 'Quand une source marchande est connectée (API, programme d’affiliation, flux produits), chaque carte affiche le prix vérifié, l’image et le lien exact du produit.'),
      h('p', { class: 'subtle' }, 'Vos réponses restent sur votre téléphone : rien n’est envoyé à un serveur en mode démo.'),
    ),
  });
}
