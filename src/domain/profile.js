// Transforme les réponses brutes du questionnaire en « signaux » exploitables par le moteur.
import { ageRange, isMinor } from './options.js';
import { INTEREST_BY_ID, TAG_INTERESTS } from './interests.js';
import { extractTags, keywords, normalize } from './lexicon.js';
import { budgetRange } from './questionnaire.js';

const nonEmpty = (v) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0);

/** @param extraTags tags supplémentaires issus d'une analyse externe (IA côté serveur, mode connecté). */
export function buildProfile(answers, { extraTags = [] } = {}) {
  const tags = new Set();
  const specified = new Set(); // passions dont l'utilisateur a précisé les sous-catégories
  const text = { favs: [], owned: [], brands: [], dream: [], notes: [], pet: '' };

  for (const id of answers.interests) {
    const interest = INTEREST_BY_ID[id];
    if (!interest) continue;
    for (const field of interest.deep) {
      if (field.when && !field.when(answers)) continue;
      const value = answers.deep?.[field.key];
      if (!nonEmpty(value)) continue;
      if (field.type === 'chips') {
        [].concat(value).forEach((v) => tags.add(v));
        if (field.multi) specified.add(id);
      }
      if (field.type === 'text') {
        if (field.role === 'pet') text.pet = String(value).trim();
        else if (text[field.role]) text[field.role].push(String(value));
      }
    }
  }

  if (answers.brands) text.brands.push(answers.brands);
  if (answers.owned) text.owned.push(answers.owned);
  if (answers.pastGifts) text.owned.push(answers.pastGifts);

  // Ce que l'utilisateur a écrit librement : on en déduit des tags et des passions implicites.
  const freeTexts = [
    ...text.favs, ...text.brands, ...text.dream,
    answers.talks, answers.wishes, answers.story, ...(answers.customInterests || []),
  ].filter(Boolean);
  const inferredTags = new Set();
  for (const t of freeTexts) for (const tag of extractTags(t)) inferredTags.add(tag);
  for (const tag of extraTags) inferredTags.add(tag);

  const interests = new Set(answers.interests);
  const inferredInterests = new Set();
  for (const tag of inferredTags) {
    // Un tag partagé par plusieurs passions (ex. « fantasy ») n'en déduit aucune si l'une est déjà choisie.
    const owners = INTEREST_BY_ID[tag] ? new Set([tag]) : TAG_INTERESTS[tag];
    if (!owners || [...owners].some((i) => interests.has(i))) continue;
    for (const i of owners) inferredInterests.add(i);
  }

  // Passions voisines (pour le mode EXTRA), en retenant d'où vient le rapprochement
  const adjacent = new Map();
  for (const id of interests) {
    for (const a of INTEREST_BY_ID[id]?.adj || []) if (!interests.has(a) && !adjacent.has(a)) adjacent.set(a, id);
  }

  const avoid = new Set(answers.avoid || []);
  if (isMinor(answers)) avoid.add('alcool');

  const formats = new Set((answers.formats || []).filter((f) => f !== 'tout'));
  const budget = budgetRange(answers) || [0, 100];

  return {
    name: answers.name?.trim() || '',
    age: ageRange(answers),
    ageBand: answers.ageBand,
    relation: answers.relation,
    closeness: answers.closeness ?? 2,
    occasion: answers.occasion,
    tones: new Set(answers.tones || []),
    formats,
    anyFormat: formats.size === 0,
    interests,
    inferredInterests,
    adjacent,
    tags,
    specified,
    inferredTags,
    traits: answers.traits || {},
    surprises: answers.surprises,
    avoid,
    budget,
    allowOver: !!answers.budget?.allowOver,
    modes: new Set(answers.modes?.length ? answers.modes : ['perfect']),
    petName: text.pet,
    // Mots-clés (racinisés) par source, pour le rapprochement avec les idées
    kw: {
      wish: new Set(keywords([answers.talks, answers.wishes, ...text.brands, ...text.dream].join(' '))),
      fav: new Set(keywords([...text.favs, ...(answers.customInterests || [])].join(' '))),
      story: new Set(keywords(answers.story || '')),
      disliked: new Set(keywords(answers.disliked || '')),
    },
    ownedText: ` ${normalize(text.owned.join(' '))} `,
    // Textes d'origine, pour citer l'utilisateur dans les explications
    source: {
      wish: [answers.talks, answers.wishes, ...text.brands, ...text.dream].filter(Boolean).join(' · '),
      fav: [...text.favs, ...(answers.customInterests || [])].join(' · '),
      story: answers.story || '',
    },
  };
}
