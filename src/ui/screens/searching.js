// Écran de recherche : on emballe le cadeau pendant que le moteur travaille.
// En mode démo, les étapes décrivent ce que fait réellement le moteur local (aucune fausse recherche en ligne).
import { h } from '../../core/dom.js';
import { iconSvg } from '../../core/icons.js';
import { animate, reducedMotion, EASE } from '../../core/motion.js';
import { draft, history, people, uid } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { normalizeAnswers } from '../../domain/questionnaire.js';
import { DATA_MODE, getRecommendations } from '../../services/recommendations.js';
import { searchingGift } from '../components/brand.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function SearchingScreen() {
  const d = draft.get();
  if (!d?.answers) {
    return { el: h('section', { class: 'screen' }), tab: null, mount: () => navigate('/', { replace: true, dir: 'fade' }) };
  }
  const answers = normalizeAnswers(d.answers);
  const name = answers.name?.trim();
  const person = d.personId ? people.get(d.personId) : null;

  const steps = [
    'Ses goûts et sa personnalité',
    'Ses passions, en détail',
    answers.modes.includes('extra') ? 'Les pistes inattendues' : 'Les correspondances fines',
    'Plusieurs gammes de prix',
    DATA_MODE === 'live' ? 'Les prix chez les marchands' : 'Le classement final',
  ];

  const gift = searchingGift();
  const bar = h('span');
  const list = h('ul', { class: 'searching__steps' },
    steps.map((s) => h('li', null, h('span', { class: 'tick', html: iconSvg('check', 3) }), s)));

  const el = h('section', { class: 'screen screen--bare searching' },
    h('div', { class: 'searching__stage' }, gift),
    h('h1', { class: 'display searching__title' }, name ? `On emballe les idées pour ${name}` : 'On emballe les idées'),
    h('div', { class: 'searching__bar' }, bar),
    list,
  );

  let alive = true;
  async function run() {
    const search = {
      id: uid('s'),
      createdAt: new Date().toISOString(),
      answers,
      personId: person?.id || null,
      adjustments: { seed: '', excluded: [], rejected: [] },
    };
    const compute = getRecommendations(answers, {
      ...search.adjustments,
      excluded: (person?.given || []).map((g) => g.id),
    }).catch(() => null);
    const total = reducedMotion() ? 600 : 2900;
    const per = total / steps.length;
    const items = [...list.children];
    for (let i = 0; i < steps.length && alive; i++) {
      items[i].classList.add('is-active');
      bar.style.width = `${((i + 0.6) / steps.length) * 100}%`;
      await sleep(per);
      items[i].classList.remove('is-active');
      items[i].classList.add('is-done');
    }
    const outcome = await compute;
    if (!alive) return;
    bar.style.width = '100%';
    history.save({ ...search, count: outcome?.result.best.length ?? 0 });
    // Le profil du proche garde ses réponses les plus récentes
    if (person) people.save({ ...person, name: name || person.name, answers });
    draft.clear();
    gift.classList.add('is-done');
    await sleep(reducedMotion() ? 100 : 700);
    if (alive) navigate(`/results/${search.id}`, { replace: true, dir: 'fade' });
  }

  return {
    el,
    tab: null,
    mount() {
      animate(gift, [{ transform: 'translateY(16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: EASE.out });
      run();
    },
    cleanup() {
      alive = false;
    },
  };
}
