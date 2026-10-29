// Accueil : un bonjour, la promesse, un bouton. Le reste se découvre en avançant.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { animate, stagger, RISE, EASE } from '../../core/motion.js';
import { draft, history, theme } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { DATA_MODE } from '../../services/recommendations.js';
import { logo, heroGift } from '../components/brand.js';
import { demoInfo } from '../components/giftCard.js';
import { startQuiz } from './quiz.js';

function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function greeting() {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 5 ? 'Bonsoir.' : 'Bonjour.';
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

  const art = heroGift();
  const hello = h('p', { class: 'home__hello' }, greeting());
  const title = h('h1', { class: 'display h1 home__title' },
    h('span', { class: 'line' }, h('span', null, 'Le cadeau parfait existe.')),
    h('span', { class: 'line' }, h('span', { class: 'accent' }, 'Trouvons-le ensemble.')),
  );
  const cta = h('button', { type: 'button', class: 'btn btn--primary btn--lg btn--block', onclick: () => startQuiz() },
    'Trouver un cadeau', icon('arrow-right'));

  const d = draft.get();
  const last = history.all()[0];
  const shortcuts = h('div', { class: 'home__links' },
    d?.answers ? h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => navigate('/quiz') }, icon('edit'), 'Reprendre') : null,
    last ? h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onclick: () => navigate(`/results/${last.id}`) }, icon('history'), 'Dernière recherche') : null,
  );

  const el = h('section', { class: 'screen home' },
    h('header', { class: 'home__top' }, logo(), themeBtn),
    h('div', { class: 'home__center' }, art, hello, title, cta, shortcuts),
    DATA_MODE === 'demo'
      ? h('button', { type: 'button', class: 'home__demo', onclick: demoInfo }, 'Version de démonstration')
      : null,
  );

  return {
    el,
    tab: 'home',
    mount() {
      animate(art, [{ transform: 'translateY(24px) scale(.88)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 900, easing: EASE.spring });
      animate(hello, RISE, { duration: 600, delay: 120 });
      [...title.querySelectorAll('.line > *')].forEach((s, i) => animate(s, [{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 820, delay: 220 + i * 120, easing: EASE.out }));
      stagger([cta, shortcuts], RISE, { delay: 560, step: 90, duration: 600 });
    },
  };
}
