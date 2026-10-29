// Historique : retrouver une recherche, ses réponses et ses idées ; la relancer ou la modifier.
import { h, formatDate, formatPrice } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { collapse, stagger, RISE } from '../../core/motion.js';
import { history, draft } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { OCCASIONS, AGE_BANDS } from '../../domain/options.js';
import { INTEREST_BY_ID } from '../../domain/interests.js';
import { budgetRange } from '../../domain/questionnaire.js';
import { MODE_META } from '../components/giftCard.js';
import { toast } from '../components/overlay.js';
import { emptyGift } from '../components/brand.js';

export function HistoryScreen() {
  const listEl = h('div');
  const el = h('section', { class: 'screen' },
    h('div', { class: 'page-head' }, h('span', { class: 'eyebrow' }, 'Vos recherches'), h('h1', { class: 'display' }, 'Historique'),
      h('p', { class: 'muted' }, 'Gardé sur cet appareil uniquement.')),
    listEl);

  function card(s) {
    const a = s.answers;
    const occ = OCCASIONS.find((o) => o.v === a.occasion);
    const age = AGE_BANDS.find((b) => b.v === a.ageBand);
    const range = budgetRange(a);
    const node = h('article', { class: 'hist' });
    const del = h('button', { type: 'button', class: 'btn btn--plain-icon', 'aria-label': 'Supprimer cette recherche' }, icon('trash'));
    del.addEventListener('click', async () => {
      history.remove(s.id);
      await collapse(node);
      render();
      toast('Recherche supprimée', { action: 'Annuler', onAction: () => { history.save(s); render(); } });
    });
    node.append(
      h('div', { class: 'hist__top' },
        h('span', { class: 'hist__icon', html: iconSvg(occ?.icon || 'gift', 1.7) }),
        h('div', { class: 'grow' },
          h('div', { class: 'hist__title' }, `${a.name ? `Pour ${a.name}` : 'Pour cette personne'}${occ ? ` · ${occ.l}` : ''}`),
          h('div', { class: 'hist__date' }, formatDate(s.createdAt))),
        del),
      h('div', { class: 'hist__tags' },
        age ? h('span', { class: 'pill' }, age.sub) : null,
        range ? h('span', { class: 'pill' }, `${range[0]} – ${formatPrice(range[1])}`) : null,
        ...a.modes.map((m) => h('span', { class: `pill pill--${m}` }, MODE_META[m].name)),
        ...a.interests.slice(0, 4).map((i) => h('span', { class: 'pill' }, icon(i), INTEREST_BY_ID[i]?.l || i)),
      ),
      h('div', { class: 'hist__actions' },
        h('button', { type: 'button', class: 'btn btn--dark btn--sm', onclick: () => navigate(`/results/${s.id}`) }, icon('gift'), 'Voir les idées'),
        h('button', { type: 'button', class: 'btn btn--soft btn--sm', onclick: () => { draft.set({ answers: a, stepId: 'who' }); navigate('/quiz'); } }, icon('edit'), 'Modifier'),
      ),
    );
    return node;
  }

  function render(animateIn = false) {
    const list = history.all();
    if (!list.length) {
      listEl.replaceChildren(h('div', { class: 'empty' }, emptyGift(),
        h('div', { class: 'empty__title' }, 'Aucune recherche pour l’instant'),
        h('p', { class: 'muted' }, 'Vos recherches apparaîtront ici, avec leurs réponses et leurs idées.'),
        h('a', { class: 'btn btn--primary', href: '#/' }, icon('star4'), 'Commencer')));
      return;
    }
    listEl.replaceChildren(...list.map(card));
    if (animateIn) stagger(listEl.children, RISE, { step: 60 });
  }

  return { el, tab: 'history', mount: () => render(true) };
}
