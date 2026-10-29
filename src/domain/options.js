// Référentiels du questionnaire (pur, sans DOM : testable et réutilisable côté serveur).

export const AGE_BANDS = [
  { v: '0-2', l: 'Bébé', sub: '0 – 2 ans', e: '🍼', range: [0, 2] },
  { v: '3-7', l: 'Enfant', sub: '3 – 7 ans', e: '🧸', range: [3, 7] },
  { v: '8-12', l: 'Enfant', sub: '8 – 12 ans', e: '🪁', range: [8, 12] },
  { v: '13-17', l: 'Ado', sub: '13 – 17 ans', e: '🎧', range: [13, 17] },
  { v: '18-25', l: 'Jeune adulte', sub: '18 – 25 ans', e: '🎓', range: [18, 25] },
  { v: '26-40', l: 'Adulte', sub: '26 – 40 ans', e: '☕', range: [26, 40] },
  { v: '41-60', l: 'Adulte', sub: '41 – 60 ans', e: '🌿', range: [41, 60] },
  { v: '61+', l: 'Senior', sub: '60 ans et +', e: '🌻', range: [61, 99] },
];

export function ageRange(answers) {
  return AGE_BANDS.find((b) => b.v === answers.ageBand)?.range || [26, 40];
}
export const isBaby = (a) => a.ageBand === '0-2';
export const isChild = (a) => ['0-2', '3-7', '8-12'].includes(a.ageBand);
export const isMinor = (a) => ageRange(a)[1] < 18;
export const isAdult = (a) => ageRange(a)[0] >= 18;

export const RELATIONS = [
  { v: 'partenaire', l: 'Partenaire', e: '💞', when: isAdult, closeness: 4 },
  { v: 'ami', l: 'Ami·e', e: '🤝', closeness: 3 },
  { v: 'parent', l: 'Mon parent', e: '🏡', when: (a) => ageRange(a)[0] >= 26, closeness: 3 },
  { v: 'enfant', l: 'Mon enfant', e: '🧒', when: (a) => ageRange(a)[1] <= 60, closeness: 4 },
  { v: 'fratrie', l: 'Frère / sœur', e: '👫', closeness: 3 },
  { v: 'grand-parent', l: 'Grand-parent', e: '👵', when: (a) => ageRange(a)[0] >= 41, closeness: 3 },
  { v: 'famille', l: 'Autre famille', e: '🌳', closeness: 2 },
  { v: 'collegue', l: 'Collègue', e: '💼', when: isAdult, closeness: 1 },
  { v: 'autre', l: 'Autre', e: '✨', closeness: 2 },
];

export const CLOSENESS = [
  { v: 1, l: 'On se connaît peu', e: '🙂' },
  { v: 2, l: "On s'apprécie", e: '😊' },
  { v: 3, l: 'Proches', e: '🥰' },
  { v: 4, l: 'Inséparables', e: '💖' },
];

const familyish = (a) => ['parent', 'grand-parent', 'famille', 'partenaire', 'autre'].includes(a.relation);

export const OCCASIONS = [
  { v: 'anniversaire', l: 'Anniversaire', e: '🎂', phrase: 'un anniversaire' },
  { v: 'noel', l: 'Noël', e: '🎄', phrase: 'Noël' },
  { v: 'saint-valentin', l: 'Saint-Valentin', e: '💝', phrase: 'la Saint-Valentin', when: (a) => a.relation === 'partenaire' },
  { v: 'fete-meres', l: 'Fête des Mères', e: '💐', phrase: 'la fête des Mères', when: (a) => isAdult(a) && familyish(a) },
  { v: 'fete-peres', l: 'Fête des Pères', e: '👔', phrase: 'la fête des Pères', when: (a) => isAdult(a) && familyish(a) },
  { v: 'naissance', l: 'Naissance', e: '👶', phrase: 'une naissance', when: isBaby },
  { v: 'mariage', l: 'Mariage', e: '💍', phrase: 'un mariage', when: isAdult },
  { v: 'retraite', l: 'Départ / retraite', e: '🥂', phrase: 'un départ', when: isAdult },
  { v: 'cremaillere', l: 'Crémaillère', e: '🏠', phrase: 'une crémaillère', when: isAdult },
  { v: 'reussite', l: 'Diplôme / réussite', e: '🎓', phrase: 'une réussite à fêter', when: (a) => !isBaby(a) },
  { v: 'merci', l: 'Remerciement', e: '🙏', phrase: 'un remerciement' },
  { v: 'surprise', l: 'Sans occasion', e: '✨', phrase: 'une surprise sans raison' },
];

export const TONES = [
  { v: 'personnel', l: 'Personnel', e: '🫶' },
  { v: 'sentimental', l: 'Sentimental', e: '💌' },
  { v: 'utile', l: 'Utile', e: '🧰' },
  { v: 'drole', l: 'Drôle', e: '😂' },
  { v: 'original', l: 'Original', e: '🦄' },
  { v: 'impressionnant', l: 'Impressionnant', e: '🤩' },
];

export const FORMATS = [
  { v: 'tout', l: 'Ouvert à tout', e: '🌈', exclusive: true },
  { v: 'objet', l: 'Un objet', e: '🎁' },
  { v: 'experience', l: 'Une expérience', e: '🎟️' },
  { v: 'atelier', l: 'Une activité / un atelier', e: '🎨' },
  { v: 'abonnement', l: 'Un abonnement', e: '📦' },
];

export const AVOID = [
  { v: 'alcool', l: "Pas d'alcool", e: '🍷' },
  { v: 'vetement', l: 'Pas de vêtements', e: '👕' },
  { v: 'cosmetique', l: 'Pas de parfum / cosmétiques', e: '🧴' },
  { v: 'deco', l: "Pas d'objets déco", e: '🖼️' },
  { v: 'livre', l: 'Pas de livres', e: '📕' },
  { v: 'gadget', l: 'Pas de gadgets', e: '🔌' },
  { v: 'nourriture', l: 'Pas de nourriture', e: '🍫' },
  { v: 'sensations', l: 'Pas de sensations fortes', e: '🎢' },
  { v: 'encombrant', l: "Rien d'encombrant", e: '📦' },
  { v: 'abonnement', l: "Pas d'abonnement", e: '🔁' },
];

/** Axes de personnalité : -1 (gauche) · 0 (un peu des deux / ne sait pas) · +1 (droite). */
export const TRAITS = [
  { k: 'adv', q: 'Son rythme de vie', left: { l: 'Cocooning', e: '🛋️' }, right: { l: "Goût de l'aventure", e: '🧭' } },
  { k: 'emo', q: 'Ce qui lui fait plaisir', left: { l: 'Le pratique', e: '🧰' }, right: { l: "L'émotion", e: '💌' } },
  { k: 'col', q: 'Son rapport aux objets', left: { l: 'Minimaliste', e: '🪴' }, right: { l: 'Aime collectionner', e: '🗃️' } },
  { k: 'exp', q: 'Plutôt…', left: { l: 'Objets à garder', e: '🎁' }, right: { l: 'Moments à vivre', e: '🎟️' } },
  { k: 'show', q: 'Côté effet', left: { l: 'Discrétion', e: '🤫' }, right: { l: 'Effet waouh', e: '🤩' } },
  { k: 'nov', q: 'Face à la nouveauté', left: { l: 'Ses habitudes', e: '☕' }, right: { l: 'La découverte', e: '✨' } },
];

export const SURPRISES = [
  { v: 'oui', l: 'Adore les surprises', e: '🎉' },
  { v: 'non', l: 'Préfère savoir', e: '📝' },
  { v: 'depend', l: 'Ça dépend', e: '🤷' },
];

export const BUDGETS = [
  { v: '0-20', l: 'Moins de 20\u00a0€', range: [0, 20], e: '🪙' },
  { v: '20-50', l: '20\u00a0–\u00a050\u00a0€', range: [20, 50], e: '💶' },
  { v: '50-100', l: '50\u00a0–\u00a0100\u00a0€', range: [50, 100], e: '💳' },
  { v: '100-200', l: '100\u00a0–\u00a0200\u00a0€', range: [100, 200], e: '💎' },
  { v: '200-500', l: '200\u00a0–\u00a0500\u00a0€', range: [200, 500], e: '👑' },
  { v: '500+', l: 'Plus de 500\u00a0€', range: [500, 2000], e: '🚀' },
  { v: 'custom', l: 'Personnalisé', range: null, e: '🎚️' },
];

export const MODES = [
  {
    v: 'safe', name: 'SAFE', title: 'Le cadeau évident, mais pertinent', icon: 'shield',
    desc: 'Des valeurs sûres, directement liées à ses passions. Objectif : que ça plaise à coup sûr.',
  },
  {
    v: 'perfect', name: 'PERFECT', title: 'Le cadeau idéal', icon: 'gem', recommended: true,
    desc: "La meilleure rencontre entre ses passions, sa personnalité, l'occasion et votre budget.",
  },
  {
    v: 'extra', name: 'EXTRA', title: 'Le cadeau inattendu', icon: 'zap',
    desc: 'Des idées qui sortent des sentiers battus, sans jamais perdre le fil de sa personnalité.',
  },
];

export const GIFT_TYPES = {
  objet: { l: 'Objet', e: '🎁' },
  experience: { l: 'Expérience', e: '🎟️' },
  atelier: { l: 'Atelier', e: '🎨' },
  abonnement: { l: 'Abonnement', e: '📦' },
};

export function emptyAnswers() {
  return {
    name: '',
    ageBand: null,
    relation: null,
    closeness: null,
    occasion: null,
    tones: [],
    formats: ['tout'],
    interests: [],
    customInterests: [],
    deep: {},
    traits: { adv: 0, emo: 0, col: 0, exp: 0, show: 0, nov: 0 },
    surprises: null,
    talks: '',
    wishes: '',
    brands: '',
    owned: '',
    pastGifts: '',
    disliked: '',
    avoid: [],
    story: '',
    budget: { preset: null, min: null, max: null, allowOver: false },
    modes: ['perfect'],
  };
}
