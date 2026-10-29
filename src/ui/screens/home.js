// Accueil : promesse, cadeau animé, démarrage en un geste, occasions rapides, reprise.
import { h } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, stagger, revealOnScroll, RISE, EASE } from '../../core/motion.js';
import { draft, history, theme } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { OCCASIONS, MODES } from '../../domain/options.js';
import { DATA_MODE } from '../../services/recommendations.js';
import { logo, heroGift } from '../components/brand.js';
import { demoInfo } from '../components/giftCard.js';
import { startQuiz } from './quiz.js';

const QUICK = [
  { v: 'anniversaire', sub: 'Un jour à fêter', tint: 'var(--perfect-soft)' },
  { v: 'noel', sub: 'Sous le sapin', tint: 'var(--safe-soft)' },
  { v: 'saint-valentin', sub: 'Pour votre moitié', tint: 'var(--perfect-soft)', prefill: { relation: 'partenaire' } },
  { v: 'fete-meres', sub: 'Pour maman', tint: 'var(--extra-soft)', prefill: { relation: 'parent' } },
  { v: 'fete-peres', sub: 'Pour papa', tint: 'var(--warn-soft)', prefill: { relation: 'parent' } },
  { v: 'naissance', sub: 'Bienvenue bébé', tint: 'var(--safe-soft)', prefill: { ageBand: '0-2', relation: 'famille' } },
  { v: 'mariage', sub: 'Pour les mariés', tint: 'var(--extra-soft)' },
  { v: 'merci', sub: 'Dire merci', tint: 'var(--warn-soft)' },
  { v: 'surprise', sub: 'Juste pour faire plaisir', tint: 'var(--perfect-soft)' },
];

function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function HomeScreen() {
  const themeBtn = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Changer de thème' });
  const paintTheme = () => themeBtn.replaceChildren(icon(effectiveTheme() === 'dark' ? 'sun' : 'moon'));
  themeBtn.addEventListener('click', () => {
    theme.set(effectiveTheme() === 'dark' ? 'light' : 'dark');
    paintTheme();
    animate(themeBtn.firstElementChild, [{ transform: 'rotate(-90deg) scale(.5)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: EASE.spring });
  });
  paintTheme();

  const title = h('h1', { class: 'display h1 hero__title' },
    h('span', { class: 'line' }, h('span', null, 'Le cadeau parfait')),
    h('span', { class: 'line' }, h('span', null, 'existe.')),
    h('span', { class: 'line' }, h('em', null, 'Trouvons-le ensemble.')),
  );
  const art = heroGift();
  const cta = h('button', { type: 'button', class: 'btn btn--primary btn--lg btn--block hero__cta', onclick: () => startQuiz() },
    icon('star4'), 'Trouver un cadeau');

  const d = draft.get();
  const last = history.all()[0];
  const resume = [];
  if (d?.answers) {
    resume.push(h('button', { type: 'button', class: 'resume', onclick: () => navigate('/quiz') },
      h('span', { class: 'resume__icon' }, '✍️'),
      h('span', { class: 'resume__text' }, h('b', null, 'Reprendre le questionnaire'),
        h('span', null, d.answers.name ? `Pour ${d.answers.name} · là où vous vous êtes arrêté·e` : 'Là où vous vous êtes arrêté·e')),
      icon('chevron-right')));
  }
  if (last) {
    const occ = OCCASIONS.find((o) => o.v === last.answers.occasion);
    resume.push(h('button', { type: 'button', class: 'resume', onclick: () => navigate(`/results/${last.id}`) },
      h('span', { class: 'resume__icon' }, occ?.e || '🎁'),
      h('span', { class: 'resume__text' }, h('b', null, 'Votre dernière recherche'),
        h('span', null, `${last.answers.name ? `Pour ${last.answers.name}` : 'Pour cette personne'}${occ ? ` · ${occ.l}` : ''}`)),
      icon('chevron-right')));
  }

  const occasions = h('div', { class: 'hscroll' }, QUICK.map((q) => {
    const occ = OCCASIONS.find((o) => o.v === q.v);
    return h('button', { type: 'button', class: 'occasion', style: { '--occ': q.tint }, onclick: () => startQuiz({ occasion: q.v, ...(q.prefill || {}) }) },
      h('span', { class: 'occasion__emoji' }, occ.e),
      h('span', null, occ.l, h('small', null, q.sub)));
  }));

  const modeTone = { safe: ['var(--safe-soft)', 'var(--safe)'], perfect: ['var(--perfect-soft)', 'var(--perfect)'], extra: ['var(--extra-soft)', 'var(--extra)'] };
  const modes = h('div', { class: 'modes-preview' }, MODES.map((m) => h('div', { class: 'mode-row reveal' },
    h('span', { class: 'mode-row__badge', style: { background: modeTone[m.v][0], color: modeTone[m.v][1] }, html: iconSvg(m.icon) }),
    h('div', null, h('b', { style: { color: modeTone[m.v][1] } }, m.name), h('p', null, m.title)))));

  const how = h('div', { class: 'how' }, [
    ['Décrivez la personne', 'Passions, personnalité, envies : des questions courtes qui s’adaptent à vos réponses.'],
    ['Fixez budget et audace', 'De la valeur sûre à l’idée inattendue, à chaque niveau de prix.'],
    ['Recevez des idées sur-mesure', 'Chaque proposition explique pourquoi elle tombe juste.'],
  ].map(([t, p], i) => h('div', { class: 'how__item reveal' }, h('span', { class: 'how__num' }, String(i + 1)), h('div', null, h('b', null, t), h('p', null, p)))));

  const sections = [
    resume.length ? h('section', { class: 'section reveal' }, ...resume) : null,
    h('section', { class: 'section' },
      h('div', { class: 'section__head' }, h('h2', { class: 'section__title' }, 'Pour quelle occasion ?'), h('span', { class: 'subtle' }, 'Glissez →')),
      occasions),
    h('section', { class: 'section' },
      h('div', { class: 'section__head' }, h('h2', { class: 'section__title' }, 'Trois niveaux d’audace')),
      modes),
    h('section', { class: 'section' },
      h('div', { class: 'section__head' }, h('h2', { class: 'section__title' }, 'Comment ça marche')),
      how),
    DATA_MODE === 'demo'
      ? h('button', { type: 'button', class: 'note footer-note reveal', style: { width: '100%', textAlign: 'left' }, onclick: demoInfo }, icon('info'),
        h('div', null, h('strong', null, 'Version de démonstration. '), 'Les idées viennent d’un catalogue local, avec des prix indicatifs. Aucun compte requis, vos réponses restent sur votre téléphone.'))
      : null,
  ];

  const el = h('section', { class: 'screen home' },
    h('header', { class: 'home__top' }, logo(), themeBtn),
    h('div', { class: 'hero' },
      art, title,
      h('p', { class: 'lead' }, 'Quelques questions, et PerfectGift déniche des idées vraiment pensées pour la personne à qui vous offrez — même quand vous n’avez aucune idée.'),
      cta,
      h('div', { class: 'hero__meta' }, h('span', null, 'Sans compte'), h('span', null, '3 minutes'), h('span', null, 'Gratuit')),
    ),
    ...sections,
  );

  let disconnect = () => {};
  return {
    el,
    tab: 'home',
    mount() {
      animate(art, [{ transform: 'translateY(30px) scale(.85)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 900, easing: EASE.spring });
      [...title.querySelectorAll('.line > *')].forEach((s, i) => animate(s, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 820, delay: 150 + i * 110, easing: EASE.out }));
      stagger([el.querySelector('.lead'), cta, el.querySelector('.hero__meta')], RISE, { delay: 520, step: 90, duration: 600 });
      stagger(occasions.children, [{ opacity: 0, transform: 'translateX(40px)' }, { opacity: 1, transform: 'none' }], { delay: 700, step: 60, duration: 600 });
      const reveals = [...el.querySelectorAll('.reveal')];
      reveals.forEach((r) => (r.style.opacity = '0'));
      disconnect = revealOnScroll(reveals, (r) => {
        r.style.opacity = '';
        animate(r, RISE, { duration: 620 });
      });
    },
    cleanup() {
      disconnect();
    },
  };
}
