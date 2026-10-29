// Résultats : sections, tri, filtres, cartes animées, relance sans refaire le questionnaire, retour utilisateur.
import { h, formatPrice } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { animate, collapse, confetti, revealOnScroll, stagger, RISE } from '../../core/motion.js';
import { history, feedback, draft } from '../../core/store.js';
import { navigate, back } from '../../core/router.js';
import { OCCASIONS, RELATIONS, GIFT_TYPES, BUDGETS } from '../../domain/options.js';
import { INTEREST_BY_ID } from '../../domain/interests.js';
import { DATA_MODE, getRecommendations, purchaseLinks } from '../../services/recommendations.js';
import { giftCard, demoInfo, MODE_META } from '../components/giftCard.js';
import { openSheet, toast } from '../components/overlay.js';
import { searchingGift, emptyGift } from '../components/brand.js';

const SECTIONS = [
  { id: 'best', l: 'Meilleur choix' },
  { id: 'relevant', l: 'Les plus pertinents' },
  { id: 'budget', l: 'Selon le budget' },
  { id: 'original', l: 'Originaux' },
  { id: 'experiences', l: 'Expériences' },
  { id: 'personal', l: 'Personnalisés' },
  { id: 'premium', l: 'Premium' },
  { id: 'unexpected', l: 'Inattendus' },
  { id: 'over', l: 'Hors budget' },
];

const SORTS = [
  { v: 'best', l: 'Meilleur choix' },
  { v: 'relevance', l: 'Pertinence' },
  { v: 'price-asc', l: 'Prix croissant' },
  { v: 'price-desc', l: 'Prix décroissant' },
  { v: 'originality', l: 'Originalité' },
];

const REFINE = [
  { id: 'more', e: '🔄', l: 'Trouve-moi d’autres idées', sub: 'Une nouvelle sélection, sans les idées actuelles', done: 'Voici une nouvelle sélection' },
  { id: 'original', e: '🦄', l: 'Sois plus original', sub: 'Plus de surprises, moins d’évidences', done: 'On ose davantage' },
  { id: 'cheaper', e: '💶', l: 'Reste dans un budget inférieur', sub: 'Plafond abaissé d’environ un tiers', done: 'Budget revu à la baisse' },
  { id: 'personal', e: '🫶', l: 'Propose-moi quelque chose de plus personnel', sub: 'Personnalisé, sentimental, unique', done: 'Des idées plus personnelles', toggle: 'personal' },
  { id: 'immaterial', e: '🎟️', l: 'Évite les objets matériels', sub: 'Expériences, ateliers et abonnements', done: 'Plus aucun objet matériel', toggle: 'noMaterial' },
  { id: 'none', e: '🙅', l: 'Je n’aime aucune de ces propositions', sub: 'On change d’approche en évitant ces pistes', done: 'On change d’approche' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function applyRefine(action, adj, shownIds) {
  const next = { ...adj, excluded: [...(adj.excluded || [])], rejected: [...(adj.rejected || [])] };
  if (action.id === 'more') next.excluded.push(...shownIds);
  if (action.id === 'original') next.originalBoost = Math.min(3, (next.originalBoost || 0) + 1);
  if (action.id === 'cheaper') next.budgetFactor = Math.max(0.2, (next.budgetFactor || 1) * 0.65);
  if (action.id === 'personal') next.personal = !next.personal;
  if (action.id === 'immaterial') next.noMaterial = !next.noMaterial;
  if (action.id === 'none') {
    next.rejected.push(...shownIds);
    next.originalBoost = Math.min(3, (next.originalBoost || 0) + 0.5);
  }
  next.round = (next.round || 0) + 1;
  next.seed = `r${next.round}`;
  next.excluded = [...new Set(next.excluded)];
  next.rejected = [...new Set(next.rejected)];
  return next;
}

const emptyFilters = () => ({ price: [null, null], types: new Set(), interests: new Set(), merchants: new Set(), minOriginality: 0, minRelevance: 0, verifiedOnly: false });

function activeFilterCount(f) {
  return (f.price[0] != null || f.price[1] != null ? 1 : 0) + (f.types.size ? 1 : 0) + (f.interests.size ? 1 : 0) + (f.merchants.size ? 1 : 0)
    + (f.minOriginality ? 1 : 0) + (f.minRelevance ? 1 : 0) + (f.verifiedOnly ? 1 : 0);
}

function priceOf(c) {
  return c.offers?.[0]?.price ?? c.rep;
}

export function ResultsScreen({ id }) {
  let search = history.get(id);
  if (!search) return notFound();

  const state = { data: null, section: 'best', sort: 'best', filters: emptyFilters(), dismissed: new Set() };
  let disconnect = () => {};
  let firstLoad = true;

  // ---------- Structure ----------
  const topTitle = h('div', { class: 'topbar__title', style: { opacity: 0, transition: 'opacity .25s' } });
  const topbar = h('header', { class: 'topbar' },
    h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Retour', onclick: () => back('/') }, icon('arrow-left')),
    topTitle,
    h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Modifier les réponses', onclick: editAnswers }, icon('edit')),
  );
  const hero = h('div', { class: 'results__hero' });
  const seg = h('div', { class: 'seg', role: 'tablist' });
  const segWrap = h('div', { class: 'seg-wrap' }, seg);
  const countEl = h('span', { class: 'results__count' });
  const sortSel = h('select', { 'aria-label': 'Trier' }, SORTS.map((s) => h('option', { value: s.v }, s.l)));
  sortSel.addEventListener('change', () => {
    state.sort = sortSel.value;
    renderList();
  });
  const filterCount = h('span', { class: 'count', style: { display: 'none' } });
  const filterBtn = h('button', { type: 'button', class: 'btn btn--icon filter-btn', 'aria-label': 'Filtres', onclick: openFilters }, icon('sliders'), filterCount);
  const toolbar = h('div', { class: 'results__toolbar' }, countEl,
    h('div', { class: 'row' }, h('label', { class: 'sort' }, sortSel, icon('chevron-down')), filterBtn));
  const list = h('div', { class: 'results__list', 'aria-live': 'polite' });
  const refinePanel = h('section', { class: 'refine' });
  const rate = h('section', { class: 'rate' });
  const fab = h('button', { type: 'button', class: 'fab is-hidden', onclick: openRefine }, icon('wand'), 'Affiner');

  const el = h('section', { class: 'screen results' }, topbar, hero, segWrap, toolbar, list, refinePanel, rate);

  // ---------- Données ----------
  async function load() {
    state.data = await getRecommendations(search.answers, search.adjustments);
    state.dismissed = new Set();
    renderAll();
  }

  function sectionList(sectionId) {
    const s = state.data.result.sections;
    if (sectionId === 'budget') return s.budget.flatMap((t) => t.items);
    return s[sectionId] || [];
  }

  function visible(items) {
    const f = state.filters;
    return items.filter((c) => {
      if (state.dismissed.has(c.idea.id)) return false;
      const p = priceOf(c);
      if (f.price[0] != null && p < f.price[0]) return false;
      if (f.price[1] != null && p > f.price[1]) return false;
      if (f.types.size && !f.types.has(c.idea.y)) return false;
      if (f.interests.size && !(c.idea.i.length ? c.idea.i.some((i) => f.interests.has(i)) : f.interests.has('generic'))) return false;
      if (f.merchants.size && !purchaseLinks(c).some((l) => f.merchants.has(l.name || l.merchant))) return false;
      if (f.minOriginality && c.idea.o < f.minOriginality) return false;
      if (f.minRelevance && c.relevance < f.minRelevance) return false;
      if (f.verifiedOnly && !c.offers?.length) return false;
      return true;
    });
  }

  function sorted(items) {
    const out = items.slice();
    if (state.sort === 'relevance') out.sort((a, b) => b.relevance - a.relevance);
    if (state.sort === 'price-asc') out.sort((a, b) => priceOf(a) - priceOf(b));
    if (state.sort === 'price-desc') out.sort((a, b) => priceOf(b) - priceOf(a));
    if (state.sort === 'originality') out.sort((a, b) => b.idea.o - a.idea.o || b.relevance - a.relevance);
    return out;
  }

  /** Groupes affichés : par mode (plusieurs modes choisis) ou par tranche de prix (section budget). */
  function groups() {
    const { result, profile } = state.data;
    const plain = state.sort === 'best' && !activeFilterCount(state.filters);
    if (state.section === 'budget' && plain) {
      return result.sections.budget.map((t) => ({
        title: t.label,
        hint: t.id === 'low' ? `jusqu’à ${formatPrice(t.range[1])}` : `${t.range[0]} – ${formatPrice(t.range[1])}`,
        items: visible(t.items),
      })).filter((g) => g.items.length);
    }
    const items = sorted(visible(sectionList(state.section)));
    if (state.section === 'best' && plain && profile.modes.size > 1) {
      return ['safe', 'perfect', 'extra']
        .map((m) => ({ title: MODE_META[m].group, mode: m, items: items.filter((c) => c.mode === m) }))
        .filter((g) => g.items.length);
    }
    return [{ items }];
  }

  // ---------- Rendu ----------
  function renderAll() {
    renderHero();
    renderSeg();
    renderList({ celebrate: firstLoad });
    renderRefine();
    renderRate();
    firstLoad = false;
  }

  function renderHero() {
    const { profile, result, mode } = state.data;
    const a = search.answers;
    const occ = OCCASIONS.find((o) => o.v === a.occasion);
    const rel = RELATIONS.find((r) => r.v === a.relation);
    const preset = BUDGETS.find((b) => b.v === a.budget?.preset);
    const budgetLabel = preset && preset.v !== 'custom' && (search.adjustments.budgetFactor || 1) === 1
      ? preset.l
      : `${result.budget[0]} – ${formatPrice(result.budget[1])}`;
    topTitle.textContent = profile.name ? `Pour ${profile.name}` : 'Vos idées';
    hero.replaceChildren(...[
      h('span', { class: 'eyebrow' }, `${result.best.length} idées sur-mesure`),
      h('h1', { class: 'display' }, 'Pour ', h('em', null, profile.name || 'cette personne')),
      h('div', { class: 'results__summary' },
        occ ? h('span', { class: 'pill' }, `${occ.e} ${occ.l}`) : null,
        rel ? h('span', { class: 'pill' }, `${rel.e} ${rel.l}`) : null,
        h('span', { class: 'pill' }, `💶 ${budgetLabel}`),
        ...['safe', 'perfect', 'extra'].filter((m) => profile.modes.has(m)).map((m) => h('span', { class: `pill pill--${m}` }, MODE_META[m].name)),
        mode === 'live'
          ? h('span', { class: 'pill pill--ok' }, icon('check'), 'Offres vérifiées')
          : h('button', { type: 'button', class: 'pill pill--demo', onclick: demoInfo }, icon('info'), 'Mode démo'),
      ),
      mode === 'demo-fallback'
        && h('div', { class: 'note' }, icon('info'), h('div', null, 'Les offres marchandes n’ont pas pu être chargées : affichage du catalogue de démonstration, prix indicatifs.')),
    ].filter(Boolean));
    if (firstLoad) stagger(hero.children, RISE, { step: 70, duration: 520 });
  }

  function renderSeg() {
    const ink = h('span', { class: 'seg__ink' });
    const counts = Object.fromEntries(SECTIONS.map((s) => [s.id, visible(sectionList(s.id)).length]));
    const buttons = SECTIONS.filter((s) => s.id === 'best' || counts[s.id] > 0).map((s) => {
      const b = h('button', { type: 'button', role: 'tab', class: ['seg__item', s.id === state.section && 'is-on'], dataset: { id: s.id }, 'aria-selected': String(s.id === state.section) },
        s.l, h('span', { class: 'n' }, String(counts[s.id])));
      b.addEventListener('click', () => {
        if (state.section === s.id) return;
        state.section = s.id;
        for (const x of seg.querySelectorAll('.seg__item')) {
          x.classList.toggle('is-on', x === b);
          x.setAttribute('aria-selected', String(x === b));
        }
        moveInk(b, ink);
        b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
        renderList();
        const y = segWrap.getBoundingClientRect().top + scrollY - 70;
        if (scrollY > y) scrollTo({ top: y, behavior: 'smooth' });
      });
      return b;
    });
    if (!SECTIONS.some((s) => s.id === state.section && (s.id === 'best' || counts[s.id] > 0))) state.section = 'best';
    seg.replaceChildren(ink, ...buttons);
    requestAnimationFrame(() => moveInk(seg.querySelector('.seg__item.is-on') || buttons[0], ink, true));
  }

  function moveInk(btn, ink, instant) {
    if (!btn) return;
    if (instant) ink.style.transition = 'none';
    ink.style.width = `${btn.offsetWidth}px`;
    ink.style.transform = `translateX(${btn.offsetLeft}px)`;
    if (instant) requestAnimationFrame(() => (ink.style.transition = ''));
  }

  function renderList({ celebrate = false } = {}) {
    disconnect();
    const gs = groups();
    const total = gs.reduce((n, g) => n + g.items.length, 0);
    countEl.textContent = total === 1 ? '1 idée' : `${total} idées`;
    const n = activeFilterCount(state.filters);
    filterCount.textContent = String(n);
    filterCount.style.display = n ? '' : 'none';
    sortSel.value = state.sort;

    if (!total) {
      list.replaceChildren(emptyState());
      animate(list.firstElementChild, RISE, { duration: 500 });
      return;
    }
    const cards = [];
    let rank = 0;
    const children = [];
    for (const g of gs) {
      if (g.title) {
        children.push(h('div', { class: 'group-head' },
          g.mode ? h('span', { class: `pill pill--${g.mode}` }, MODE_META[g.mode].name) : null,
          h('span', { class: 'group-head__title' }, g.title),
          g.hint ? h('span', { class: 'subtle' }, g.hint) : null,
          h('span', { class: 'group-head__line' }),
        ));
      }
      for (const c of g.items) {
        rank++;
        const card = giftCard(c, { searchId: id, rank: state.section === 'best' && state.sort === 'best' && rank <= 3 ? rank : null, onReject: reject });
        cards.push(card);
        children.push(card);
      }
    }
    list.replaceChildren(...children);
    for (const head of list.querySelectorAll('.group-head')) animate(head, RISE, { duration: 500 });
    let delay = 0;
    disconnect = revealOnScroll(cards, (card) => {
      setTimeout(() => card.reveal(), delay);
      delay = Math.min(delay + 90, 270);
      setTimeout(() => (delay = 0), 400);
    });
    if (celebrate) setTimeout(() => confetti({ count: 36, origin: { x: 0.5, y: 0.15 } }), 250);
  }

  function emptyState() {
    const adj = search.adjustments;
    const tweaked = (adj.excluded?.length || adj.rejected?.length || adj.noMaterial || adj.personal || (adj.budgetFactor || 1) < 1 || adj.originalBoost);
    const filtered = activeFilterCount(state.filters) > 0;
    return h('div', { class: 'empty' }, emptyGift(),
      h('div', { class: 'empty__title' }, filtered ? 'Aucune idée avec ces filtres' : 'On a fait le tour de ces pistes'),
      h('p', { class: 'muted' }, filtered
        ? 'Retirez un filtre pour revoir des idées.'
        : 'Élargissez le budget ou les formats, ou repartez des propositions initiales.'),
      h('div', { class: 'row row--wrap', style: { justifyContent: 'center' } },
        filtered ? h('button', { type: 'button', class: 'btn btn--dark', onclick: () => { state.filters = emptyFilters(); renderSeg(); renderList(); } }, 'Retirer les filtres') : null,
        !filtered && tweaked ? h('button', { type: 'button', class: 'btn btn--dark', onclick: resetAdjustments }, icon('undo'), 'Revenir aux idées initiales') : null,
        h('button', { type: 'button', class: 'btn btn--soft', onclick: editAnswers }, icon('edit'), 'Modifier les réponses'),
      ),
    );
  }

  function renderRefine() {
    const adj = search.adjustments;
    refinePanel.replaceChildren(
      h('h2', { class: 'refine__title' }, 'Pas encore ', h('em', { style: { fontStyle: 'italic', color: 'var(--gold)' } }, 'le'), ' bon ?'),
      h('p', null, 'Affinez sans refaire le questionnaire.'),
      h('div', { class: 'chips' }, REFINE.map((a) => h('button', {
        type: 'button', class: ['chip chip--sm', a.toggle && adj[a.toggle] && 'is-on'], onclick: () => relaunch(a),
      }, h('span', { class: 'chip__emoji' }, a.e), a.l))),
    );
  }

  function renderRate() {
    const existing = feedback.forSearch(id);
    if (existing) {
      rate.replaceChildren(h('p', { class: 'rate__thanks' }, 'Merci pour votre retour ✦'), h('p', { class: 'subtle mt-8' }, 'Il nous aide à mieux classer les prochaines idées.'));
      return;
    }
    const answer = (value) => {
      feedback.add({ searchId: id, kind: 'rating', value, round: search.adjustments.round || 0 });
      animate(rate, [{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }], { duration: 300 });
      renderRate();
      if (value === 'bad') setTimeout(openRefine, 450);
    };
    rate.replaceChildren(
      h('p', { class: 'rate__q' }, 'Ces idées vous semblent-elles pertinentes ?'),
      h('div', { class: 'rate__btns' },
        h('button', { type: 'button', class: 'btn btn--soft', onclick: () => answer('good') }, icon('thumbs-up'), 'Oui, bien vu'),
        h('button', { type: 'button', class: 'btn btn--soft', onclick: () => answer('bad') }, icon('thumbs-down'), 'Pas vraiment'),
      ),
    );
  }

  // ---------- Actions ----------
  function reject(c, card) {
    state.dismissed.add(c.idea.id);
    const rejected = [...new Set([...(search.adjustments.rejected || []), c.idea.id])];
    search = history.update(id, { adjustments: { ...search.adjustments, rejected } });
    feedback.add({ searchId: id, kind: 'reject', ideaId: c.idea.id });
    collapse(card, { direction: -1 }).then(() => {
      card.remove();
      const left = list.querySelectorAll('.gcard').length;
      countEl.textContent = left === 1 ? '1 idée' : `${left} idées`;
      if (!left) renderList();
    });
    toast('Idée écartée, on en tiendra compte', {
      action: 'Annuler',
      onAction: () => {
        state.dismissed.delete(c.idea.id);
        search = history.update(id, { adjustments: { ...search.adjustments, rejected: (search.adjustments.rejected || []).filter((x) => x !== c.idea.id) } });
        renderList();
      },
    });
  }

  let refineSheet = null;
  function openRefine() {
    const adj = search.adjustments;
    refineSheet = openSheet({
      title: 'Affiner la sélection',
      body: h('div', { class: 'refine-list' }, REFINE.map((a) => h('button', { type: 'button', class: 'refine-item', onclick: () => relaunch(a) },
        h('span', { class: 'e' }, a.e),
        h('span', { class: 'grow' }, h('b', null, a.l), h('span', null, a.toggle && adj[a.toggle] ? 'Activé · touchez pour désactiver' : a.sub)),
        a.toggle && adj[a.toggle] ? h('span', { class: 'pill pill--ok' }, icon('check'), 'Actif') : icon('chevron-right'),
      ))),
      onClose: () => (refineSheet = null),
    });
  }

  async function relaunch(action) {
    refineSheet?.close();
    const shown = state.data.result.best.map((c) => c.idea.id);
    search = history.update(id, { adjustments: applyRefine(action, search.adjustments, shown) });
    await withReloading(action.done);
  }

  async function resetAdjustments() {
    search = history.update(id, { adjustments: { seed: '', excluded: [], rejected: [], round: (search.adjustments.round || 0) + 1 } });
    await withReloading('Retour aux idées initiales');
  }

  async function withReloading(doneMessage) {
    const gift = searchingGift();
    const overlay = h('div', { class: 'reloading' }, h('div', { class: 'reloading__inner' }, gift,
      h('p', { class: 'display h3' }, 'On réemballe tout…'), h('p', { class: 'muted' }, 'Nouvelle sélection en préparation')));
    document.getElementById('layer').append(overlay);
    animate(overlay, [{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
    await Promise.all([load(), sleep(1100)]);
    gift.classList.add('is-open');
    await sleep(380);
    await animate(overlay, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, keep: true });
    overlay.remove();
    const y = segWrap.getBoundingClientRect().top + scrollY - 70;
    scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    toast(`${doneMessage} · ${state.data.result.best.length} idées`);
  }

  function editAnswers() {
    draft.set({ answers: search.answers, stepId: 'budget', updatedAt: new Date().toISOString() });
    navigate('/quiz');
  }

  function openFilters() {
    const f = {
      ...state.filters,
      price: [...state.filters.price],
      types: new Set(state.filters.types), interests: new Set(state.filters.interests), merchants: new Set(state.filters.merchants),
    };
    const pool = sectionList(state.section).filter((c) => !state.dismissed.has(c.idea.id));
    const interestIds = [...new Set(pool.flatMap((c) => (c.idea.i.length ? [c.idea.i[0]] : ['generic'])))];
    const merchantNames = [...new Set(pool.flatMap((c) => purchaseLinks(c).map((l) => l.name || l.merchant)))];
    const typeIds = [...new Set(pool.map((c) => c.idea.y))];
    const applyBtn = h('button', { type: 'button', class: 'btn btn--primary grow' });

    const preview = () => {
      const saved = state.filters;
      state.filters = f;
      const n = visible(sectionList(state.section)).length;
      state.filters = saved;
      applyBtn.textContent = n ? `Voir ${n} idée${n > 1 ? 's' : ''}` : 'Aucune idée';
      applyBtn.disabled = !n;
    };
    const chipSet = (set, items) => h('div', { class: 'chips' }, items.map((it) => {
      const b = h('button', { type: 'button', class: ['chip chip--sm', set.has(it.v) && 'is-on'] }, it.e ? h('span', { class: 'chip__emoji' }, it.e) : null, it.l);
      b.addEventListener('click', () => {
        set.has(it.v) ? set.delete(it.v) : set.add(it.v);
        b.classList.toggle('is-on', set.has(it.v));
        preview();
      });
      return b;
    }));
    const single = (key, items) => h('div', { class: 'chips' }, items.map((it) => {
      const b = h('button', { type: 'button', class: ['chip chip--sm', f[key] === it.v && 'is-on'] }, it.l);
      b.addEventListener('click', () => {
        f[key] = it.v;
        for (const x of b.parentElement.children) x.classList.toggle('is-on', x === b);
        preview();
      });
      return b;
    }));
    const minIn = h('input', { class: 'input', type: 'number', inputmode: 'numeric', placeholder: 'Min', value: f.price[0] ?? '' });
    const maxIn = h('input', { class: 'input', type: 'number', inputmode: 'numeric', placeholder: `Max (${state.data.result.budget[1]})`, value: f.price[1] ?? '' });
    const onPrice = () => {
      f.price = [minIn.value === '' ? null : Number(minIn.value), maxIn.value === '' ? null : Number(maxIn.value)];
      preview();
    };
    minIn.addEventListener('input', onPrice);
    maxIn.addEventListener('input', onPrice);

    const group = (title, ...content) => h('div', { class: 'filter-group' }, h('div', { class: 'filter-group__title' }, title), ...content);
    const body = h('div', null,
      group('Prix (€)', h('div', { class: 'range-row' }, minIn, h('span', { class: 'subtle' }, '→'), maxIn)),
      group('Type de cadeau', chipSet(f.types, typeIds.map((t) => ({ v: t, l: GIFT_TYPES[t].l, e: GIFT_TYPES[t].e })))),
      group('Catégorie', chipSet(f.interests, interestIds.map((i) => (i === 'generic' ? { v: 'generic', l: 'Idées transversales', e: '🎁' } : { v: i, l: INTEREST_BY_ID[i].l, e: INTEREST_BY_ID[i].e })))),
      group('Originalité', single('minOriginality', [{ v: 0, l: 'Toutes' }, { v: 3, l: 'Originales et +' }, { v: 4, l: 'Audacieuses' }])),
      group('Pertinence', single('minRelevance', [{ v: 0, l: 'Toutes' }, { v: 70, l: '70 % et +' }, { v: 80, l: '80 % et +' }])),
      group('Vendeur', chipSet(f.merchants, merchantNames.map((m) => ({ v: m, l: m })))),
      group('Disponibilité', single('verifiedOnly', [{ v: false, l: 'Toutes' }, { v: true, l: 'Vérifiée uniquement' }]),
        DATA_MODE === 'demo' ? h('p', { class: 'subtle mt-8' }, 'En mode démo, aucune disponibilité n’est vérifiée.') : null),
    );
    const sheet = openSheet({
      title: 'Filtres',
      body,
      footer: [
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => { state.filters = emptyFilters(); sheet.close(); renderSeg(); renderList(); } }, 'Réinitialiser'),
        applyBtn,
      ],
    });
    applyBtn.addEventListener('click', () => {
      state.filters = f;
      sheet.close();
      renderSeg();
      renderList();
    });
    preview();
  }

  // ---------- Défilement : barre supérieure + bouton « Affiner » ----------
  const onScroll = () => {
    const y = scrollY;
    topbar.classList.toggle('is-scrolled', y > 8);
    topTitle.style.opacity = y > 120 ? '1' : '0';
    const refineTop = refinePanel.getBoundingClientRect().top;
    fab.classList.toggle('is-hidden', y < 420 || refineTop < innerHeight - 60);
  };

  return {
    el,
    tab: 'home',
    mount() {
      document.getElementById('layer').append(fab);
      addEventListener('scroll', onScroll, { passive: true });
      animate(topbar, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      list.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'muted' }, 'Préparation des idées…')));
      load();
    },
    cleanup() {
      removeEventListener('scroll', onScroll);
      disconnect();
      fab.remove();
    },
  };
}

function notFound() {
  return {
    el: h('section', { class: 'screen' },
      h('div', { class: 'empty' }, emptyGift(),
        h('div', { class: 'empty__title' }, 'Recherche introuvable'),
        h('p', { class: 'muted' }, 'Elle a peut-être été supprimée de l’historique.'),
        h('a', { class: 'btn btn--primary', href: '#/' }, 'Nouvelle recherche'))),
    tab: 'home',
  };
}
