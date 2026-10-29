// Accueil : un bonjour et une étiquette cadeau à remplir. Pour ceux qui reviennent, les occasions qui approchent.
import { h } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, stagger, RISE, EASE } from '../../core/motion.js';
import { draft, people, theme } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { OCCASIONS } from '../../domain/options.js';
import { upcomingEvents, relativeDays } from '../../domain/calendar.js';
import { logo, giftTag } from '../components/brand.js';
import { startQuiz } from './quiz.js';
import { avatar, findGiftFor } from './people.js';

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

  const known = people.all();
  const nameIn = h('input', {
    class: 'tag__input', type: 'text', placeholder: 'son prénom', maxlength: 30,
    autocomplete: 'off', autocapitalize: 'words', enterkeyhint: 'go', 'aria-label': 'Prénom de la personne',
  });
  const go = () => {
    const name = nameIn.value.trim();
    const match = name && known.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (match) findGiftFor(match);
    else startQuiz(name ? { name } : {});
  };
  nameIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  });

  const tag = giftTag(nameIn);
  const hello = h('p', { class: 'home__hello' }, greeting());
  const title = h('h1', { class: 'display h1 home__title' }, 'Pour qui cherche\u2011t\u2011on un cadeau ?');
  const cta = h('button', { type: 'button', class: 'btn btn--primary btn--lg btn--block', onclick: go }, 'Trouver un cadeau', icon('arrow-right'));
  const d = draft.get();
  const resume = d?.answers
    ? h('button', { type: 'button', class: 'btn btn--ghost btn--sm home__resume', onclick: () => navigate('/quiz') },
      icon('edit'), d.answers.name ? `Reprendre pour ${d.answers.name}` : 'Reprendre où vous en étiez')
    : null;

  // Ce qui approche (anniversaires des proches, grandes fêtes), dans les 60 jours
  const events = upcomingEvents(known).slice(0, 3);
  const upcoming = events.length
    ? h('section', { class: 'home__block' },
      h('h2', { class: 'home__label' }, 'Bientôt'),
      h('div', { class: 'events' }, events.map((e) => {
        const occ = OCCASIONS.find((o) => o.v === e.occasion);
        return h('button', {
          type: 'button', class: 'event',
          onclick: () => (e.person ? findGiftFor(e.person, e.occasion) : startQuiz({ occasion: e.occasion })),
        },
        e.person ? avatar(e.person) : h('span', { class: 'event__icon', html: iconSvg(occ?.icon || 'gift', 1.8) }),
        h('span', { class: 'grow' }, h('b', null, e.label), h('span', null, relativeDays(e.days))),
        icon('chevron-right'));
      })))
    : null;

  const peopleRow = known.length
    ? h('section', { class: 'home__block' },
      h('h2', { class: 'home__label' }, 'Vos proches'),
      h('div', { class: 'faces' },
        known.slice(0, 8).map((p) => h('button', { type: 'button', class: 'face', onclick: () => findGiftFor(p) }, avatar(p), h('span', null, p.name))),
        h('a', { class: 'face face--all', href: '#/people' }, h('span', { class: 'avatar avatar--md avatar--ghost' }, icon('plus')), h('span', null, 'Gérer'))))
    : null;

  const el = h('section', { class: 'screen home' },
    h('header', { class: 'home__top' }, logo(), themeBtn),
    h('div', { class: 'home__main' }, hello, title, tag, cta, resume),
    upcoming,
    peopleRow,
  );

  return {
    el,
    tab: 'home',
    mount() {
      animate(hello, RISE, { duration: 600 });
      animate(title, RISE, { duration: 700, delay: 80 });
      // L'étiquette arrive en se balançant au bout de sa ficelle
      animate(tag, [
        { transform: 'translateY(-30px) rotate(-16deg)', opacity: 0 },
        { transform: 'translateY(0) rotate(4deg)', opacity: 1, offset: 0.55 },
        { transform: 'rotate(-3deg)', offset: 0.8 },
        { transform: 'rotate(0deg)' },
      ], { duration: 1300, delay: 180, easing: 'ease-out' });
      stagger([cta, resume, upcoming, peopleRow].filter(Boolean), RISE, { delay: 420, step: 90, duration: 600 });
    },
  };
}
