// Référentiels du questionnaire (pur, sans DOM : testable et réutilisable côté serveur).

export const AGE_BANDS = [
  { v: '0-2', big: '0–2', l: 'Bébé', sub: '0 – 2 ans', range: [0, 2] },
  { v: '3-7', big: '3–7', l: 'Enfant', sub: '3 – 7 ans', range: [3, 7] },
  { v: '8-12', big: '8–12', l: 'Enfant', sub: '8 – 12 ans', range: [8, 12] },
  { v: '13-17', big: '13–17', l: 'Ado', sub: '13 – 17 ans', range: [13, 17] },
  { v: '18-25', big: '18–25', l: 'Jeune adulte', sub: '18 – 25 ans', range: [18, 25] },
  { v: '26-40', big: '26–40', l: 'Adulte', sub: '26 – 40 ans', range: [26, 40] },
  { v: '41-60', big: '41–60', l: 'Adulte', sub: '41 – 60 ans', range: [41, 60] },
  { v: '61+', big: '60+', l: 'Senior', sub: '60 ans et +', range: [61, 99] },
];

export function ageRange(answers) {
  return AGE_BANDS.find((b) => b.v === answers.ageBand)?.range || [26, 40];
}
export const isBaby = (a) => a.ageBand === '0-2';
export const isChild = (a) => ['0-2', '3-7', '8-12'].includes(a.ageBand);
export const isMinor = (a) => ageRange(a)[1] < 18;
export const isAdult = (a) => ageRange(a)[0] >= 18;

export const RELATIONS = [
  { v: 'partenaire', l: 'Partenaire', when: isAdult, closeness: 4 },
  { v: 'ami', l: 'Ami·e', closeness: 3 },
  { v: 'parent', l: 'Mon parent', when: (a) => ageRange(a)[0] >= 26, closeness: 3 },
  { v: 'enfant', l: 'Mon enfant', when: (a) => ageRange(a)[1] <= 60, closeness: 4 },
  { v: 'fratrie', l: 'Frère / sœur', closeness: 3 },
  { v: 'grand-parent', l: 'Grand-parent', when: (a) => ageRange(a)[0] >= 41, closeness: 3 },
  { v: 'famille', l: 'Autre famille', closeness: 2 },
  { v: 'collegue', l: 'Collègue', when: isAdult, closeness: 1 },
  { v: 'autre', l: 'Autre', closeness: 2 },
];

export const CLOSENESS = [
  { v: 1, l: 'On se connaît peu' },
  { v: 2, l: "On s'apprécie" },
  { v: 3, l: 'Proches' },
  { v: 4, l: 'Inséparables' },
];

const familyish = (a) => ['parent', 'grand-parent', 'famille', 'partenaire', 'autre'].includes(a.relation);

export const OCCASIONS = [
  { v: 'anniversaire', icon: 'cake', l: 'Anniversaire', phrase: 'un anniversaire' },
  { v: 'noel', icon: 'tree', l: 'Noël', phrase: 'Noël' },
  { v: 'saint-valentin', icon: 'heart', l: 'Saint-Valentin', phrase: 'la Saint-Valentin', when: (a) => a.relation === 'partenaire' },
  { v: 'fete-meres', icon: 'beaute', l: 'Fête des Mères', phrase: 'la fête des Mères', when: (a) => isAdult(a) && familyish(a) },
  { v: 'fete-peres', icon: 'coffee', l: 'Fête des Pères', phrase: 'la fête des Pères', when: (a) => isAdult(a) && familyish(a) },
  { v: 'naissance', icon: 'baby', l: 'Naissance', phrase: 'une naissance', when: isBaby },
  { v: 'mariage', icon: 'rings', l: 'Mariage', phrase: 'un mariage', when: isAdult },
  { v: 'retraite', icon: 'party', l: 'Départ / retraite', phrase: 'un départ', when: isAdult },
  { v: 'cremaillere', icon: 'home', l: 'Crémaillère', phrase: 'une crémaillère', when: isAdult },
  { v: 'reussite', icon: 'graduation', l: 'Diplôme / réussite', phrase: 'une réussite à fêter', when: (a) => !isBaby(a) },
  { v: 'merci', icon: 'smile', l: 'Remerciement', phrase: 'un remerciement' },
  { v: 'surprise', icon: 'sparkles', l: 'Sans occasion', phrase: 'une surprise sans raison' },
];

export const TONES = [
  { v: 'personnel', l: 'Personnel' },
  { v: 'sentimental', l: 'Sentimental' },
  { v: 'utile', l: 'Utile' },
  { v: 'drole', l: 'Drôle' },
  { v: 'original', l: 'Original' },
  { v: 'impressionnant', l: 'Impressionnant' },
];

export const FORMATS = [
  { v: 'tout', l: 'Ouvert à tout', exclusive: true },
  { v: 'objet', l: 'Un objet' },
  { v: 'experience', l: 'Une expérience' },
  { v: 'atelier', l: 'Une activité / un atelier' },
  { v: 'abonnement', l: 'Un abonnement' },
];

export const AVOID = [
  { v: 'alcool', l: "Pas d'alcool" },
  { v: 'vetement', l: 'Pas de vêtements' },
  { v: 'cosmetique', l: 'Pas de parfum / cosmétiques' },
  { v: 'deco', l: "Pas d'objets déco" },
  { v: 'livre', l: 'Pas de livres' },
  { v: 'gadget', l: 'Pas de gadgets' },
  { v: 'nourriture', l: 'Pas de nourriture' },
  { v: 'sensations', l: 'Pas de sensations fortes' },
  { v: 'encombrant', l: "Rien d'encombrant" },
  { v: 'abonnement', l: "Pas d'abonnement" },
];

/** Axes de personnalité : -1 (gauche) · 0 (un peu des deux / ne sait pas) · +1 (droite). */
export const TRAITS = [
  { k: 'adv', q: 'Son rythme de vie', left: { l: 'Cocooning' }, right: { l: "Goût de l'aventure" } },
  { k: 'emo', q: 'Ce qui lui fait plaisir', left: { l: 'Le pratique' }, right: { l: "L'émotion" } },
  { k: 'col', q: 'Son rapport aux objets', left: { l: 'Minimaliste' }, right: { l: 'Aime collectionner' } },
  { k: 'exp', q: 'Plutôt…', left: { l: 'Objets à garder' }, right: { l: 'Moments à vivre' } },
  { k: 'show', q: 'Côté effet', left: { l: 'Discrétion' }, right: { l: 'Effet waouh' } },
  { k: 'nov', q: 'Face à la nouveauté', left: { l: 'Ses habitudes' }, right: { l: 'La découverte' } },
];

export const SURPRISES = [
  { v: 'oui', l: 'Adore les surprises' },
  { v: 'non', l: 'Préfère savoir' },
  { v: 'depend', l: 'Ça dépend' },
];

export const BUDGETS = [
  { v: '0-20', pre: 'moins de', big: '20\u00a0€', l: 'Moins de 20\u00a0€', range: [0, 20] },
  { v: '20-50', pre: '', big: '20–50\u00a0€', l: '20\u00a0–\u00a050\u00a0€', range: [20, 50] },
  { v: '50-100', pre: '', big: '50–100\u00a0€', l: '50\u00a0–\u00a0100\u00a0€', range: [50, 100] },
  { v: '100-200', pre: '', big: '100–200\u00a0€', l: '100\u00a0–\u00a0200\u00a0€', range: [100, 200] },
  { v: '200-500', pre: '', big: '200–500\u00a0€', l: '200\u00a0–\u00a0500\u00a0€', range: [200, 500] },
  { v: '500+', pre: 'plus de', big: '500\u00a0€', l: 'Plus de 500\u00a0€', range: [500, 2000] },
  { v: 'custom', pre: '', big: 'Sur mesure', l: 'Personnalisé', range: null },
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
  objet: { icon: 'gift', l: 'Objet' },
  experience: { icon: 'ticket', l: 'Expérience' },
  atelier: { icon: 'brush', l: 'Atelier' },
  abonnement: { icon: 'repeat', l: 'Abonnement' },
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
