// Questionnaire dynamique : chaque étape et chaque champ peut dépendre des réponses précédentes.
// Pur (aucun DOM) : l'interface ne fait qu'afficher ce que ce module décide.
import {
  AGE_BANDS, RELATIONS, CLOSENESS, OCCASIONS, TONES, FORMATS, AVOID, TRAITS, SURPRISES, BUDGETS,
  isBaby, isChild,
} from './options.js';
import { INTEREST_BY_ID, interestsFor } from './interests.js';

const who = (a) => a.name?.trim() || 'cette personne';

export const STEPS = [
  {
    id: 'who', section: 'La personne',
    title: 'Pour qui cherche-t-on ?',
    sub: 'Le prénom sert uniquement à personnaliser les idées. Rien ne quitte votre téléphone.',
    fields: [
      { type: 'text', key: 'name', label: 'Son prénom', placeholder: 'ex. Léa', optional: true, maxLength: 30, autocomplete: 'off' },
      { type: 'tiles', key: 'ageBand', label: 'Son âge', options: AGE_BANDS, columns: 2 },
    ],
    valid: (a) => !!a.ageBand,
  },
  {
    id: 'relation', section: 'La personne',
    title: (a) => `Quel est votre lien avec ${who(a)} ?`,
    fields: [
      { type: 'chips', key: 'relation', options: (a) => RELATIONS.filter((r) => !r.when || r.when(a)) },
      { type: 'scale', key: 'closeness', label: 'Votre niveau de proximité', options: CLOSENESS, when: (a) => !!a.relation },
    ],
    valid: (a) => !!a.relation,
  },
  {
    id: 'occasion', section: "L'occasion",
    title: "Quelle est l'occasion ?",
    fields: [{ type: 'chips', key: 'occasion', options: (a) => OCCASIONS.filter((x) => !x.when || x.when(a)) }],
    valid: (a) => !!a.occasion,
  },
  {
    id: 'intent', section: "L'intention",
    title: 'Quel cadeau imaginez-vous ?',
    sub: "Jusqu'à 3 intentions, puis le format. Dans le doute, laissez « Ouvert à tout ».",
    optional: true,
    fields: [
      { type: 'chips', key: 'tones', label: 'Le cadeau doit être…', multi: true, max: 3, options: TONES, optional: true },
      { type: 'chips', key: 'formats', label: 'Plutôt…', multi: true, options: FORMATS },
    ],
    valid: (a) => a.formats.length > 0,
  },
  {
    id: 'interests', section: 'Ses passions',
    title: (a) => (isBaby(a) ? 'Quel univers pour son éveil ?' : a.name?.trim() ? `Qu'est-ce qui passionne ${a.name.trim()} ?` : 'Quelles sont ses passions ?'),
    sub: (a) => (isBaby(a) ? 'Choisissez un ou plusieurs univers.' : 'Sélectionnez tout ce qui compte. Une passion manque ? Ajoutez-la.'),
    fields: [{ type: 'interests', key: 'interests' }],
    valid: (a) => a.interests.length + a.customInterests.length > 0,
    skipLabel: 'Je ne sais pas',
  },
  { id: 'deep', dynamic: true },
  {
    id: 'personality', section: 'Personnalité',
    title: (a) => `Et côté personnalité${a.name?.trim() ? `, ${a.name.trim()}` : ''} ?`,
    sub: 'Pas de bonne réponse : suivez votre intuition. Le milieu veut dire « un peu des deux ».',
    when: (a) => !isBaby(a),
    optional: true,
    fields: [
      { type: 'bipolar', key: 'traits', options: (a) => (isChild(a) ? TRAITS.filter((t) => ['adv', 'exp', 'nov'].includes(t.k)) : TRAITS) },
      { type: 'chips', key: 'surprises', label: 'Les surprises ?', options: SURPRISES, optional: true },
    ],
  },
  {
    id: 'context', section: 'Ses envies',
    title: 'Ce qui lui trotte dans la tête',
    sub: 'Sujets du moment, envies, objets convoités : de vraies pépites pour nous.',
    when: (a) => !isBaby(a),
    optional: true,
    fields: [
      { type: 'text', key: 'talks', role: 'talks', label: 'Un sujet qui revient souvent en ce moment', placeholder: 'ex. son futur voyage au Japon, la céramique…', optional: true },
      { type: 'text', key: 'wishes', role: 'wishes', label: 'Une chose qui lui ferait envie', placeholder: 'ex. une platine vinyle, un bon couteau…', optional: true },
      { type: 'text', key: 'brands', role: 'brands', label: 'Marques ou produits convoités', placeholder: 'ex. Le Creuset, Nintendo, Aesop…', optional: true },
    ],
  },
  {
    id: 'extras', section: 'À éviter',
    title: "Ce qu'on doit éviter",
    sub: 'Pour ne pas offrir un doublon ou un cadeau qui tombe à plat.',
    optional: true,
    fields: [
      { type: 'text', key: 'owned', role: 'owned', label: 'Ce que la personne possède déjà', placeholder: 'ex. Kindle, AirPods, machine Nespresso…', optional: true },
      { type: 'text', key: 'pastGifts', role: 'owned', label: 'Cadeaux déjà offerts', placeholder: 'ex. un coffret spa l\'an dernier…', optional: true },
      { type: 'text', key: 'disliked', role: 'disliked', label: "Cadeaux qui n'ont pas plu", placeholder: 'ex. les bougies, les mugs…', optional: true },
      { type: 'chips', key: 'avoid', label: 'Catégories à éviter', multi: true, options: AVOID, optional: true },
    ],
  },
  {
    id: 'story', section: 'Le petit plus',
    title: 'Raconte-nous tout.',
    sub: 'Tout ce qui pourrait nous aider à trouver LE cadeau : anecdotes, rêves, manies, souvenirs partagés…',
    optional: true,
    fields: [
      { type: 'textarea', key: 'story', role: 'story', placeholder: 'ex. Vient de se mettre à la céramique, rêve du Japon, boit trois cafés par jour et ne jure que par les jeux de société en famille…', optional: true, maxLength: 1200 },
    ],
  },
  {
    id: 'budget', section: 'Budget',
    title: 'Quel budget ?',
    sub: 'On cherche la meilleure idée à chaque niveau de prix, pas seulement près du maximum.',
    fields: [{ type: 'budget', key: 'budget', options: BUDGETS }],
    valid: (a) => budgetRange(a) !== null,
  },
  {
    id: 'modes', section: 'Audace',
    title: "Quel niveau d'audace ?",
    sub: 'Combinez plusieurs modes pour une sélection rangée du plus sûr au plus audacieux.',
    fields: [{ type: 'modes', key: 'modes' }],
    valid: (a) => a.modes.length > 0,
  },
];

function deepStep(interest) {
  return {
    id: `deep-${interest.id}`,
    section: 'Ses passions',
    interest: interest.id,
    title: interest.deepTitle,
    sub: 'Plus on en sait, plus les idées seront précises. Tout est facultatif.',
    optional: true,
    fields: interest.deep,
  };
}

/** Étapes visibles pour les réponses courantes (l'ordre des passions suit l'ordre de sélection). */
export function visibleSteps(answers) {
  const out = [];
  for (const step of STEPS) {
    if (step.dynamic) {
      if (isBaby(answers)) continue;
      const allowed = new Set(interestsFor(answers).map((i) => i.id));
      for (const id of answers.interests) if (allowed.has(id)) out.push(deepStep(INTEREST_BY_ID[id]));
      continue;
    }
    if (!step.when || step.when(answers)) out.push(step);
  }
  return out;
}

export function resolve(value, answers) {
  return typeof value === 'function' ? value(answers) : value;
}

export function visibleFields(step, answers) {
  return step.fields.filter((f) => !f.when || f.when(answers));
}

export function fieldOptions(field, answers) {
  return resolve(field.options, answers) || [];
}

export function isStepValid(step, answers) {
  return step.valid ? !!step.valid(answers) : true;
}

export function budgetRange(answers) {
  const b = answers.budget || {};
  if (!b.preset) return null;
  if (b.preset !== 'custom') return BUDGETS.find((x) => x.v === b.preset)?.range || null;
  const min = Number(b.min);
  const max = Number(b.max);
  if (!Number.isFinite(max) || max <= 0) return null;
  const safeMin = Number.isFinite(min) && min >= 0 ? min : 0;
  if (safeMin > max) return null;
  return [safeMin, max];
}

/**
 * Remet les réponses en cohérence quand une réponse amont change
 * (ex. l'âge passe à « enfant » : « partenaire » et « collègue » ne sont plus proposés).
 */
export function normalizeAnswers(a) {
  const next = { ...a, deep: { ...a.deep }, traits: { ...a.traits }, budget: { ...a.budget } };
  const relations = RELATIONS.filter((r) => !r.when || r.when(next));
  if (next.relation && !relations.some((r) => r.v === next.relation)) {
    next.relation = null;
    next.closeness = null;
  }
  if (next.relation && next.closeness == null) {
    next.closeness = relations.find((r) => r.v === next.relation)?.closeness ?? 2;
  }
  const occasions = OCCASIONS.filter((x) => !x.when || x.when(next));
  if (next.occasion && !occasions.some((x) => x.v === next.occasion)) next.occasion = null;
  const allowed = new Set(interestsFor(next).map((i) => i.id));
  next.interests = next.interests.filter((id) => allowed.has(id));
  if (!next.formats.length) next.formats = ['tout'];
  return next;
}
