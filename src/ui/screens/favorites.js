// Favoris : retrouver, ouvrir, retirer et comparer les idées sauvegardées.
import { h, formatRange } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, collapse, stagger, pop, RISE } from '../../core/motion.js';
import { favorites, history, people } from '../../core/store.js';
import { GIFT_TYPES } from '../../domain/options.js';
import { merchantRow, MODE_META } from '../components/giftCard.js';
import { openSheet, toast } from '../components/overlay.js';
import { emptyGift } from '../components/brand.js';
import { giftArt } from '../components/art.js';
import { shareContent } from '../components/share.js';

const ORIGINALITY = ['', 'Classique', 'Sûr', 'Original', 'Audacieux', 'Inattendu'];
const priceText = (f) => (f.verified ? `${formatRange(f.price)}` : `≈ ${formatRange(f.price)}`);

function openFavorite(f) {
  openSheet({
    title: f.t,
    body: h('div', { class: 'stack' },
      h('p', { class: 'muted' }, f.d),
      h('div', { class: 'why', style: { '--m': `var(--${f.mode})`, '--m-soft': `var(--${f.mode}-soft)` } },
        h('div', { class: 'why__label' }, icon('tag'), 'Pourquoi ce cadeau ?'), h('p', null, f.why)),
      h('div', { class: 'row' }, h('span', { class: 'gcard__amount' }, priceText(f)),
        h('span', { class: f.verified ? 'pill pill--ok' : 'pill pill--demo' }, f.verified ? 'Prix vérifié' : 'Prix indicatif')),
      h('div', null, f.links.map((l) => merchantRow({ ...l, merchant: l.name }))),
    ),
  });
}

function compare(list) {
  const cheapest = Math.min(...list.map((f) => f.price[0]));
  const mostRelevant = Math.max(...list.map((f) => f.relevance));
  const row = (label, value, best) => h('div', { class: 'compare__row' }, h('dt', null, label), h('dd', { class: best ? 'compare__best' : '' }, value));
  openSheet({
    title: 'Comparer',
    body: h('div', { class: 'compare' }, list.map((f) => h('div', { class: 'compare__col' },
      h('div', { class: 'compare__art', style: { '--a': f.hue[0], '--b': f.hue[1] } }, giftArt(f.ic || 'gift', { size: 'md' })),
      h('dl', { class: 'compare__body' },
        h('div', { class: 'compare__title' }, f.t),
        row('Prix', `${priceText(f)}${f.verified ? '' : ' (indicatif)'}`, f.price[0] === cheapest),
        row('Pertinence', `${f.relevance} %`, f.relevance === mostRelevant),
        row('Originalité', `${'●'.repeat(f.o)}${'○'.repeat(5 - f.o)} · ${ORIGINALITY[f.o]}`),
        row('Type', GIFT_TYPES[f.y].l),
        row('Mode', MODE_META[f.mode].label),
        row('Où', f.links.filter((l) => l.id !== 'gshop' && l.id !== 'experiences').map((l) => l.name).join(', ') || 'Recherche en ligne'),
        row('Pourquoi', f.why),
      )))),
  });
}

export function FavoritesScreen() {
  let selecting = false;
  const selected = new Set();
  const head = h('div', { class: 'page-head' });
  const listEl = h('div');
  const bar = h('div', { class: 'compare-bar' });
  const el = h('section', { class: 'screen' }, head, listEl);

  function renderHead() {
    const n = favorites.all().length;
    head.replaceChildren(
      h('span', { class: 'eyebrow' }, 'Vos coups de cœur'),
      h('div', { class: 'row row--between' },
        h('h1', { class: 'display' }, 'Favoris'),
        h('div', { class: 'row', style: { gap: '8px' } },
          n ? h('button', { type: 'button', class: 'btn btn--icon btn--sm', 'aria-label': 'Partager ma liste', onclick: shareList }, icon('share')) : null,
          n >= 2 ? h('button', { type: 'button', class: ['btn btn--sm', selecting ? 'btn--dark' : 'btn--soft'], onclick: toggleSelect }, icon('columns'), selecting ? 'Terminer' : 'Comparer') : null)),
      h('p', { class: 'muted' }, n ? `${n} idée${n > 1 ? 's' : ''} sauvegardée${n > 1 ? 's' : ''}${selecting ? ' · touchez pour sélectionner (3 max)' : ''}` : ''),
    );
  }

  function shareList() {
    const lines = favorites.all().map((f) => `• ${f.t} (≈ ${formatRange(f.price)})${f.offered ? ' : offert' : ''}`);
    shareContent({ title: 'Mes idées cadeaux', text: ['Mes idées cadeaux :', ...lines].join('\n') });
  }

  /** « Offert » : la personne liée à la recherche ne se verra plus proposer cette idée. */
  function toggleOffered(f) {
    const on = !f.offered;
    favorites.patch(f.id, { offered: on });
    const personId = f.searchId ? history.get(f.searchId)?.personId : null;
    if (personId) people.setGiven(personId, f, on);
    const who = personId ? people.get(personId)?.name : null;
    toast(on ? (who ? `Noté : offert à ${who}` : 'Marqué comme offert') : 'Plus marqué comme offert');
    render();
  }

  function toggleSelect() {
    selecting = !selecting;
    selected.clear();
    render();
  }

  function renderBar() {
    if (!selecting) {
      bar.remove();
      return;
    }
    bar.replaceChildren(
      h('span', null, selected.size ? `${selected.size} sélectionnée${selected.size > 1 ? 's' : ''}` : 'Choisissez 2 ou 3 idées'),
      h('button', { type: 'button', class: 'btn btn--primary btn--sm', disabled: selected.size < 2, onclick: () => compare(favorites.all().filter((f) => selected.has(f.id))) }, 'Comparer'),
    );
    if (!bar.isConnected) {
      document.getElementById('layer').append(bar);
      animate(bar, [{ transform: 'translate(-50%, 120%)' }, { transform: 'translate(-50%, 0)' }], { duration: 420 });
    }
  }

  function item(f) {
    const card = h('div', { class: ['litem', selected.has(f.id) && 'is-selected'] });
    const open = h('button', { type: 'button', class: 'litem__open', 'aria-label': f.t });
    open.addEventListener('click', () => {
      if (!selecting) return openFavorite(f);
      if (selected.has(f.id)) selected.delete(f.id);
      else if (selected.size >= 3) return toast('3 idées maximum');
      else selected.add(f.id);
      card.classList.toggle('is-selected', selected.has(f.id));
      pop(card, 1.02);
      renderBar();
    });
    const remove = h('button', { type: 'button', class: 'btn btn--plain-icon', 'aria-label': 'Retirer des favoris', style: { position: 'relative', zIndex: 1 } }, icon('trash'));
    remove.addEventListener('click', async () => {
      favorites.remove(f.id);
      await collapse(card);
      render();
      toast('Retiré des favoris', { action: 'Annuler', onAction: () => { favorites.toggle(f); render(); } });
    });
    const offered = h('button', {
      type: 'button', class: ['btn btn--plain-icon litem__offered', f.offered && 'is-on'],
      'aria-label': f.offered ? 'Ne plus marquer comme offert' : 'Marquer comme offert', 'aria-pressed': String(!!f.offered),
      style: { position: 'relative', zIndex: 1 },
    }, icon('offered'));
    offered.addEventListener('click', () => toggleOffered(f));
    card.classList.toggle('is-offered', !!f.offered);
    card.append(
      h('span', { class: 'litem__art', style: { '--a': f.hue[0], '--b': f.hue[1] }, html: iconSvg(f.ic || 'gift', 1.6) }),
      h('span', { class: 'litem__body' },
        h('span', { class: 'litem__title', style: { display: 'block' } }, f.t),
        h('span', { class: 'litem__meta' }, h('b', null, priceText(f)), h('span', null, GIFT_TYPES[f.y].l),
          f.offered ? h('span', { class: 'litem__badge' }, 'Offert') : h('span', null, `${f.relevance} % pertinent`)),
      ),
      h('span', { class: 'litem__actions' }, selecting ? h('span', { class: 'litem__select', html: iconSvg('check') }) : [offered, remove]),
      open,
    );
    return card;
  }

  function render(animateIn = false) {
    renderHead();
    const list = favorites.all();
    if (!list.length) {
      selecting = false;
      listEl.replaceChildren(h('div', { class: 'empty' }, emptyGift(),
        h('div', { class: 'empty__title' }, 'Pas encore de favoris'),
        h('p', { class: 'muted' }, 'Touchez le cœur sur une idée pour la retrouver ici.'),
        h('a', { class: 'btn btn--primary', href: '#/' }, 'Trouver un cadeau', icon('arrow-right'))));
    } else {
      listEl.replaceChildren(...list.map(item));
      if (animateIn) stagger(listEl.children, RISE, { step: 50 });
    }
    renderBar();
  }

  return {
    el,
    tab: 'favorites',
    mount() {
      render(true);
      stagger(head.children, RISE, { step: 60 });
    },
    cleanup() {
      bar.remove();
    },
  };
}
