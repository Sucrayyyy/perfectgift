// Proches : chaque personne garde ses goûts, sa date d'anniversaire et les cadeaux déjà offerts.
// Trouver un cadeau pour un proche reprend ses réponses et va droit au budget.
import { h } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { collapse, stagger, RISE } from '../../core/motion.js';
import { people, uid } from '../../core/store.js';
import { RELATIONS, emptyAnswers } from '../../domain/options.js';
import { parseBirthday, nextAnnual, daysUntil, relativeDays, buildIcs } from '../../domain/calendar.js';
import { openSheet, toast } from '../components/overlay.js';
import { emptyGift } from '../components/brand.js';
import { downloadIcs, APP_URL } from '../components/share.js';
import { startQuiz } from './quiz.js';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const AVATAR_TONES = ['#E9483A', '#1C8A6E', '#6A48F5', '#D99418', '#C2285F', '#1C6FB8'];

export function avatar(person, size = 'md') {
  let hash = 0;
  for (const ch of person.name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return h('span', { class: ['avatar', `avatar--${size}`], style: { background: AVATAR_TONES[hash % AVATAR_TONES.length] } },
    person.name.trim().charAt(0).toUpperCase() || '?');
}

/** Lance une recherche pour un proche : ses réponses sont reprises, il ne reste qu'à confirmer l'occasion et le budget. */
export function findGiftFor(person, occasion) {
  if (!person.answers) {
    startQuiz({ name: person.name }, { personId: person.id });
    return;
  }
  const answers = { ...emptyAnswers(), ...person.answers, name: person.name };
  if (occasion) answers.occasion = occasion;
  startQuiz(answers, { stepId: occasion ? 'budget' : 'occasion', personId: person.id });
}

function birthdayLabel(person) {
  const b = parseBirthday(person.birthday);
  if (!b) return null;
  const days = daysUntil(nextAnnual(b.month, b.day));
  return `Anniversaire le ${b.day} ${MONTHS[b.month - 1]} · ${relativeDays(days)}`;
}

export function editPerson(person, onDone) {
  const isNew = !person;
  const nameIn = h('input', { class: 'input', type: 'text', placeholder: 'Prénom', maxlength: 30, value: person?.name || '' });
  const dateIn = h('input', { class: 'input', type: 'date', value: person?.birthday || '' });
  const saveBtn = h('button', { type: 'button', class: 'btn btn--primary grow' }, isNew ? 'Ajouter' : 'Enregistrer');
  const sheet = openSheet({
    title: isNew ? 'Nouveau proche' : person.name,
    body: h('div', { class: 'stack' },
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Prénom'), nameIn),
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Date d’anniversaire', h('span', { class: 'opt' }, 'facultatif')), dateIn),
    ),
    footer: saveBtn,
  });
  if (isNew) setTimeout(() => nameIn.focus(), 300);
  saveBtn.addEventListener('click', () => {
    const name = nameIn.value.trim();
    if (!name) return nameIn.focus();
    const saved = people.save({ ...(person || { id: uid('p') }), name, birthday: dateIn.value || null });
    sheet.close();
    onDone?.(saved);
  });
}

function reminder(person) {
  const b = parseBirthday(person.birthday);
  if (!b) {
    toast('Ajoutez d’abord sa date d’anniversaire');
    return;
  }
  downloadIcs(`anniversaire-${person.name.toLowerCase()}.ics`, buildIcs({
    uid: person.id,
    title: `Anniversaire de ${person.name}`,
    description: `Trouver le cadeau de ${person.name} avec PerfectGift : ${APP_URL}`,
    url: APP_URL,
    month: b.month,
    day: b.day,
  }));
  toast('Rappel prêt : ajoutez-le à votre calendrier');
}

export function PeopleScreen() {
  const listEl = h('div', { class: 'people' });
  const addBtn = h('button', { type: 'button', class: 'btn btn--soft btn--sm' }, icon('plus'), 'Ajouter');
  addBtn.addEventListener('click', () => editPerson(null, () => render()));
  const el = h('section', { class: 'screen' },
    h('div', { class: 'page-head' },
      h('div', { class: 'row row--between' }, h('h1', { class: 'display' }, 'Proches'), addBtn)),
    listEl);

  function card(p) {
    const rel = RELATIONS.find((r) => r.v === p.answers?.relation);
    const bday = birthdayLabel(p);
    const node = h('article', { class: 'pcard' });
    const menu = h('button', { type: 'button', class: 'btn btn--plain-icon', 'aria-label': `Options pour ${p.name}` }, icon('more'));
    menu.addEventListener('click', () => {
      const sheet = openSheet({
        title: p.name,
        body: h('div', { class: 'refine-list' },
          h('button', { type: 'button', class: 'refine-item', onclick: () => { sheet.close(); editPerson(p, () => render()); } },
            h('span', { class: 'e' }, icon('edit')), h('span', { class: 'grow' }, h('b', null, 'Modifier'), h('span', null, 'Prénom, date d’anniversaire'))),
          h('button', { type: 'button', class: 'refine-item', onclick: () => { sheet.close(); reminder(p); } },
            h('span', { class: 'e' }, icon('bell')), h('span', { class: 'grow' }, h('b', null, 'Rappel dans mon calendrier'), h('span', null, 'Une alerte 7 jours avant son anniversaire'))),
          h('button', { type: 'button', class: 'refine-item', onclick: async () => {
            sheet.close();
            people.remove(p.id);
            await collapse(node);
            render();
            toast(`${p.name} retiré·e de vos proches`, { action: 'Annuler', onAction: () => { people.save(p); render(); } });
          } }, h('span', { class: 'e' }, icon('trash')), h('span', { class: 'grow' }, h('b', null, 'Retirer'), h('span', null, 'Ses goûts et ses cadeaux offerts seront oubliés'))),
        ),
      });
    });
    const given = p.given || [];
    node.append(
      h('div', { class: 'pcard__top' },
        avatar(p, 'lg'),
        h('div', { class: 'grow' },
          h('div', { class: 'pcard__name' }, p.name),
          h('div', { class: 'pcard__meta' }, [rel?.l, p.answers ? null : 'Goûts à découvrir'].filter(Boolean).join(' · ') || 'Proche'),
        ),
        menu),
      bday
        ? h('div', { class: 'pcard__line' }, icon('cake'), bday)
        : h('button', { type: 'button', class: 'pcard__line pcard__line--add', onclick: () => editPerson(p, () => render()) }, icon('calendar'), 'Ajouter sa date d’anniversaire'),
      given.length
        ? h('div', { class: 'pcard__line' }, icon('offered'), `Déjà offert : ${given.slice(0, 3).map((g) => g.t).join(', ')}${given.length > 3 ? '…' : ''}`)
        : null,
      h('button', { type: 'button', class: 'btn btn--primary btn--block mt-8', onclick: () => findGiftFor(p) },
        p.answers ? `Un cadeau pour ${p.name}` : `Décrire ${p.name}`, icon('arrow-right')),
    );
    return node;
  }

  function render(animateIn = false) {
    const list = people.all();
    if (!list.length) {
      listEl.replaceChildren(h('div', { class: 'empty' }, emptyGift(),
        h('div', { class: 'empty__title' }, 'Personne pour l’instant'),
        h('p', { class: 'muted' }, 'Enregistrez vos proches pour retrouver leurs goûts, leurs dates et les cadeaux déjà offerts.'),
        h('button', { type: 'button', class: 'btn btn--primary', onclick: () => editPerson(null, () => render()) }, icon('plus'), 'Ajouter un proche')));
      return;
    }
    listEl.replaceChildren(...list.map(card));
    if (animateIn) stagger(listEl.children, RISE, { step: 60 });
  }

  return { el, tab: 'people', mount: () => render(true) };
}

