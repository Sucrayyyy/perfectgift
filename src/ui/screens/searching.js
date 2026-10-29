// Écran « PerfectGift analyse vos réponses » : le cadeau tremble, les passions gravitent, puis il s'ouvre.
// En mode démo, les étapes décrivent ce que fait réellement le moteur local (aucune fausse recherche en ligne).
import { h } from '../../core/dom.js';
import { iconSvg } from '../../core/icons.js';
import { animate, confetti, reducedMotion, EASE } from '../../core/motion.js';
import { draft, history, uid } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { INTEREST_BY_ID } from '../../domain/interests.js';
import { OCCASIONS } from '../../domain/options.js';
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

  const steps = [
    'Analyse de sa personnalité',
    'Croisement de ses passions',
    answers.modes.includes('extra') ? 'Exploration des pistes inattendues' : 'Recherche des correspondances fines',
    'Répartition par gammes de prix',
    DATA_MODE === 'live' ? 'Vérification des prix chez les marchands' : 'Classement par pertinence',
  ];
  const messages = [
    name ? `On apprend à connaître ${name}…` : 'On apprend à connaître cette personne…',
    'Ce qui rend cette personne unique compte plus que les best-sellers.',
    'On écarte ce qui est déjà possédé et ce qu’il faut éviter.',
    'La meilleure idée à chaque niveau de prix, pas seulement la plus chère.',
    'Dernières finitions… et un joli ruban.',
  ];

  const icons = [...answers.interests.filter((i) => INTEREST_BY_ID[i]), OCCASIONS.find((o) => o.v === answers.occasion)?.icon]
    .filter(Boolean);
  for (const filler of ['gift', 'heart', 'sparkles', 'star4', 'ticket', 'leaf']) if (icons.length < 6) icons.push(filler);
  const orbit = h('div', { class: 'searching__orbit' },
    icons.slice(0, 8).map((name, i, arr) => h('span', { style: { '--a': `${(360 / arr.length) * i}deg` } }, h('i', { html: iconSvg(name, 1.8) }))));
  const gift = searchingGift();
  const msg = h('p', { class: 'searching__msg' }, messages[0]);
  const bar = h('span');
  const list = h('ul', { class: 'searching__steps' },
    steps.map((s) => h('li', null, h('span', { class: 'tick', html: iconSvg('check') }), s)));

  const el = h('section', { class: 'screen screen--bare searching' },
    h('div', { class: 'searching__stage' },
      h('span', { class: 'searching__halo' }), h('span', { class: 'searching__ring' }), orbit, gift),
    h('h1', { class: 'display searching__title' }, 'On cherche ', h('em', null, 'LE'), ' cadeau'),
    msg,
    h('div', { class: 'searching__bar' }, bar),
    list,
    DATA_MODE === 'demo' ? h('p', { class: 'subtle mt-8' }, 'Mode démo · catalogue d’idées local, sans prix en temps réel') : null,
  );

  let alive = true;
  async function run() {
    const search = {
      id: uid('s'),
      createdAt: new Date().toISOString(),
      answers,
      adjustments: { seed: '', excluded: [], rejected: [] },
    };
    const compute = getRecommendations(answers, search.adjustments).catch(() => null);
    const total = reducedMotion() ? 600 : 3000;
    const per = total / steps.length;
    const items = [...list.children];
    for (let i = 0; i < steps.length && alive; i++) {
      items[i].classList.add('is-active');
      if (i > 0) {
        animate(msg, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 160, keep: true }).then(() => {
          msg.textContent = messages[i];
          animate(msg, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260 });
        });
      }
      bar.style.width = `${((i + 0.6) / steps.length) * 100}%`;
      await sleep(per);
      items[i].classList.remove('is-active');
      items[i].classList.add('is-done');
    }
    const outcome = await compute;
    if (!alive) return;
    bar.style.width = '100%';
    history.save({ ...search, count: outcome?.result.best.length ?? 0 });
    draft.clear();
    gift.classList.add('is-open');
    confetti({ origin: { x: 0.5, y: 0.3 } });
    await sleep(reducedMotion() ? 100 : 900);
    if (alive) navigate(`/results/${search.id}`, { replace: true, dir: 'fade' });
  }

  return {
    el,
    tab: null,
    mount() {
      animate(gift, [{ transform: 'scale(.5) translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 700, easing: EASE.spring });
      run();
    },
    cleanup() {
      alive = false;
    },
  };
}
