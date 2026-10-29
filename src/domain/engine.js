// Moteur de recommandation : filtre, note, diversifie et organise les idées.
// Pur et déterministe (mêmes entrées → mêmes résultats), donc testable et rejouable depuis l'historique.
//
// 1. Filtres stricts : âge, catégories à éviter, liens autorisés, objets déjà possédés, retours « ne convient pas ».
// 2. Note : passions, détails des passions, envies citées, texte libre, intention, personnalité, occasion,
//    relation, budget, mode SAFE / PERFECT / EXTRA, ajustements de relance.
// 3. Sélection : dédoublonnage, diversité des passions et des types, couverture des tranches de prix.
import { keywords } from './lexicon.js';
import { INTEREST_OPTIONS } from './interests.js';
import { explain } from './explain.js';

const MODE_ORDER = { safe: 0, perfect: 1, extra: 2 };
const AVOIDABLE = ['alcool', 'vetement', 'cosmetique', 'deco', 'livre', 'gadget', 'nourriture', 'sensations', 'encombrant'];
const PERSONAL_TAGS = ['chien', 'chat', 'cheval', 'nac'];

const index = new WeakMap();
function meta(idea) {
  let m = index.get(idea);
  if (!m) {
    m = { kw: new Set(keywords(`${idea.t} ${idea.q} ${idea.tg.join(' ')}`)), mid: (idea.p[0] + idea.p[1]) / 2 };
    index.set(idea, m);
  }
  return m;
}

function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const hits = (set, iterable) => [...iterable].filter((x) => set.has(x));

export function normalizeAdjustments(adj = {}) {
  return {
    excluded: new Set(adj.excluded || []),
    rejected: new Set(adj.rejected || []),
    originalBoost: adj.originalBoost || 0,
    personal: !!adj.personal,
    noMaterial: !!adj.noMaterial,
    budgetFactor: adj.budgetFactor || 1,
    seed: adj.seed || '',
  };
}

export function effectiveBudget(profile, adj) {
  const [min, max] = profile.budget;
  if (adj.budgetFactor >= 1) return [min, max];
  const nextMax = Math.max(10, Math.round(max * adj.budgetFactor));
  return [Math.min(Math.round(min * adj.budgetFactor), nextMax), nextMax];
}

/** Prix représentatif d'une idée, ramené dans le budget quand la fourchette le dépasse. */
export function displayRange(idea, budget) {
  const [p0, p1] = idea.p;
  if (p0 > budget[1]) return { range: [p0, p1], clipped: false, over: true };
  if (p1 > budget[1]) return { range: [p0, budget[1]], clipped: true, over: false };
  return { range: [p0, p1], clipped: false, over: false };
}

export function repPrice(idea, budget) {
  return Math.min(meta(idea).mid, Math.max(idea.p[0], budget[1]));
}

export function budgetTiers(budget) {
  const max = budget[1];
  const a = Math.round(max * 0.4);
  const b = Math.round(max * 0.75);
  return [
    { id: 'low', label: 'Petit prix', range: [0, a] },
    { id: 'mid', label: 'Cœur de budget', range: [a, b] },
    { id: 'high', label: 'Haut de budget', range: [b, max] },
  ];
}

function tierOf(price, tiers) {
  if (price <= tiers[0].range[1]) return 'low';
  if (price <= tiers[1].range[1]) return 'mid';
  return 'high';
}

function eligible(idea, profile, adj) {
  const ageMid = (profile.age[0] + profile.age[1]) / 2;
  if (idea.a[0] > ageMid || idea.a[1] < ageMid) return false;
  if (idea.rel.length && !idea.rel.includes(profile.relation)) return false;
  for (const tag of AVOIDABLE) if (profile.avoid.has(tag) && idea.tg.includes(tag)) return false;
  if (profile.avoid.has('abonnement') && idea.y === 'abonnement') return false;
  if (adj.noMaterial && idea.y === 'objet') return false;
  if (idea.own.length && profile.ownedText.trim()) {
    for (const phrase of idea.own) {
      if (profile.ownedText.includes(` ${phrase} `) || profile.ownedText.includes(` ${phrase}s `)) return false;
    }
  }
  return true;
}

function modeLabel(idea, direct, adjacentOnly) {
  if (idea.o >= 4 || (adjacentOnly && idea.o >= 3)) return 'extra';
  if (idea.o <= 2 && direct) return 'safe';
  if (idea.o <= 1) return 'safe';
  return 'perfect';
}

function modeFit(mode, idea, ctx) {
  if (mode === 'safe') {
    return (idea.o <= 2 ? 1.6 : idea.o === 3 ? 0 : -1.6 * (idea.o - 3)) + (ctx.direct ? 1 : -1);
  }
  if (mode === 'extra') {
    return (idea.o >= 4 ? 2 : idea.o === 3 ? 0.4 : -1.6) + (ctx.adjacentOnly ? 1.2 : 0);
  }
  // perfect : la meilleure correspondance globale
  return (ctx.precise ? 1.2 : 0) + (idea.o >= 2 && idea.o <= 4 ? 0.8 : 0) + Math.max(0, ctx.traitScore) * 0.3;
}

function rejectedSignature(rejectedIds, catalog) {
  const interests = {};
  const tags = {};
  for (const idea of catalog) {
    if (!rejectedIds.has(idea.id)) continue;
    for (const i of idea.i) interests[i] = (interests[i] || 0) + 1;
    for (const t of idea.tg) tags[t] = (tags[t] || 0) + 1;
  }
  return { interests, tags };
}

export function scoreIdea(idea, profile, adj, budget, rejected) {
  const m = meta(idea);
  const r = { interests: [], inferred: [], tags: [], textTags: [], wish: [], fav: [], story: [], trait: null, occasion: false, adjacent: false, pet: false, budgetRoom: false };
  let s = 0;

  // Passions
  r.interests = idea.i.filter((i) => profile.interests.has(i));
  const direct = r.interests.length > 0;
  if (direct) s += 3 + 0.8 * (r.interests.length - 1);
  else {
    r.inferred = idea.i.filter((i) => profile.inferredInterests.has(i));
    if (r.inferred.length) s += 2;
  }
  const near = !direct && !r.inferred.length ? idea.i.find((i) => profile.adjacent.has(i)) : null;
  const adjacentOnly = !!near;
  if (near) {
    s += 0.9;
    r.adjacent = { from: profile.adjacent.get(near), to: near };
  }

  // Détails des passions et texte libre
  r.tags = idea.tg.filter((t) => profile.tags.has(t));
  s += Math.min(r.tags.length, 3) * 1.6;
  // Sous-catégories précisées mais non concernées (ex. aime le café et la pâtisserie, pas le vin)
  for (const i of r.interests) {
    if (!profile.specified.has(i)) continue;
    const inInterest = idea.tg.filter((t) => INTEREST_OPTIONS[i].has(t));
    if (inInterest.length && !inInterest.some((t) => profile.tags.has(t))) s -= 1.6;
  }
  r.textTags = idea.tg.filter((t) => profile.inferredTags.has(t) && !profile.tags.has(t));
  s += Math.min(r.textTags.length, 2) * 1.3;

  r.wish = hits(profile.kw.wish, m.kw);
  if (r.wish.length) s += 2.5 + 1.5 * (Math.min(r.wish.length, 3) - 1);
  r.fav = hits(profile.kw.fav, m.kw);
  s += Math.min(r.fav.length, 2) * 1.2;
  r.story = hits(profile.kw.story, m.kw);
  s += Math.min(r.story.length, 3) * 0.7;
  s -= hits(profile.kw.disliked, m.kw).length * 2.5;

  // Intention et format
  s += Math.min(idea.tn.filter((t) => profile.tones.has(t)).length, 2) * 1;
  if (!profile.anyFormat) s += profile.formats.has(idea.y) ? 1.2 : -2.5;

  // Personnalité (le type d'idée donne aussi une affinité « objet / moment à vivre »)
  const v = { ...idea.v };
  if (v.exp === undefined) v.exp = idea.y === 'objet' ? -1 : 1;
  let traitScore = 0;
  let best = null;
  for (const [k, dir] of Object.entries(v)) {
    const p = profile.traits[k] || 0;
    traitScore += dir * p;
    if (dir * p > 0 && k !== 'exp' && !best) best = { k, dir };
  }
  if (!best && v.exp * (profile.traits.exp || 0) > 0) best = { k: 'exp', dir: v.exp };
  r.trait = best;
  s += traitScore * 0.8;
  if (profile.surprises === 'non' && idea.o >= 4) s -= 0.8;
  if (profile.surprises === 'oui' && idea.o >= 4) s += 0.5;

  // Occasion et relation
  if (idea.occ.includes(profile.occasion)) {
    s += 1.5;
    r.occasion = true;
  }
  if (profile.occasion === 'saint-valentin' && (idea.tg.includes('couple') || idea.tn.includes('sentimental'))) s += 1.2;
  if (profile.closeness <= 1 && idea.tn.includes('sentimental')) s -= 1.4;
  if (profile.closeness >= 4 && (idea.tn.includes('sentimental') || idea.tn.includes('personnel'))) s += 0.6;
  if (profile.relation === 'collegue') {
    if (idea.p[0] > 60) s -= 1;
    if (idea.tn.includes('utile') || idea.tg.includes('nourriture')) s += 0.6;
  }
  if (profile.petName && idea.tg.includes('personnalise') && idea.tg.some((t) => PERSONAL_TAGS.includes(t))) {
    s += 1.2;
    r.pet = true;
  }

  // Budget : la pertinence prime, mais un cadeau très en dessous de l'intention est moins indiqué
  const [bmin, bmax] = budget;
  if (bmin >= 40 && idea.p[1] < bmin * 0.5) s -= 1.5;
  else if (idea.p[1] < bmin) s -= 0.5;
  if (m.mid <= bmax) s += 0.3;
  r.budgetRoom = bmax >= 30 && idea.p[1] <= bmax * 0.4;

  // Mode d'originalité : on garde le meilleur des modes choisis
  const ctx = { direct, adjacentOnly, precise: r.tags.length + r.wish.length + r.fav.length > 0, traitScore };
  s += Math.max(...[...profile.modes].map((mode) => modeFit(mode, idea, ctx)));

  // Ajustements demandés à la relance
  if (adj.originalBoost) s += adj.originalBoost * (idea.o - 3) * 0.8;
  if (adj.personal) s += idea.tn.includes('personnel') || idea.tn.includes('sentimental') || idea.tg.includes('personnalise') ? 2 : -0.6;
  for (const i of idea.i) s -= 0.5 * (rejected.interests[i] || 0);
  for (const t of idea.tg) s -= 0.2 * (rejected.tags[t] || 0);

  // Légère variation déterministe pour départager les ex aequo et renouveler les relances
  s += hash01(idea.id + adj.seed) * 0.35;

  const mode = modeLabel(idea, direct, adjacentOnly);
  return { idea, score: s, r, mode };
}

export function relevance(score) {
  return Math.max(38, Math.min(98, Math.round(100 * (1 - Math.exp(-Math.max(score, 0) / 6)))));
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((c) => (seen.has(c.idea.g) ? false : seen.add(c.idea.g)));
}

function selectDiverse(pool, tiers, n) {
  const remaining = pool.slice(0, 90);
  const picked = [];
  const perInterest = {};
  const perType = {};
  const tiersSeen = new Set();
  while (picked.length < n && remaining.length) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    remaining.forEach((c, i) => {
      const primary = c.idea.i[0] || 'generic';
      let v = c.score - 1.1 * (perInterest[primary] || 0) - 0.5 * Math.max(0, (perType[c.idea.y] || 0) - 3);
      if (picked.length < 6 && !tiersSeen.has(c.tier)) v += 0.8;
      if (v > bestVal) {
        bestVal = v;
        bestIdx = i;
      }
    });
    const c = remaining.splice(bestIdx, 1)[0];
    picked.push(c);
    const primary = c.idea.i[0] || 'generic';
    perInterest[primary] = (perInterest[primary] || 0) + 1;
    perType[c.idea.y] = (perType[c.idea.y] || 0) + 1;
    tiersSeen.add(c.tier);
  }
  return picked;
}

/**
 * @returns {{ best, ranked, overBudget, sections, budget, tiers }}
 */
export function recommend(profile, catalog, adjustments = {}, { size = 18 } = {}) {
  const adj = normalizeAdjustments(adjustments);
  const budget = effectiveBudget(profile, adj);
  const tiers = budgetTiers(budget);
  const rejected = rejectedSignature(adj.rejected, catalog);

  const inBudget = [];
  const over = [];
  for (const idea of catalog) {
    if (adj.excluded.has(idea.id) || adj.rejected.has(idea.id)) continue;
    if (!eligible(idea, profile, adj)) continue;
    const c = scoreIdea(idea, profile, adj, budget, rejected);
    if (c.score < 1) continue;
    c.price = displayRange(idea, budget);
    c.rep = repPrice(idea, budget);
    c.tier = tierOf(c.rep, tiers);
    c.relevance = relevance(c.score);
    if (idea.p[0] > budget[1]) {
      if (profile.allowOver && idea.p[0] <= budget[1] * 1.6) over.push(c);
      continue;
    }
    inBudget.push(c);
  }

  const ranked = dedupe(inBudget.sort((a, b) => b.score - a.score));
  let best;
  if (profile.modes.size > 1) {
    // Plusieurs modes : une part de la sélection pour chacun, rangée du plus sûr au plus audacieux
    const modes = Object.keys(MODE_ORDER).filter((m) => profile.modes.has(m));
    const quota = Math.floor(size / modes.length);
    best = modes.flatMap((m) => selectDiverse(ranked.filter((c) => c.mode === m), tiers, quota));
    if (best.length < size) {
      const taken = new Set(best.map((c) => c.idea.id));
      best.push(...selectDiverse(ranked.filter((c) => !taken.has(c.idea.id)), tiers, size - best.length));
    }
    best.sort((a, b) => MODE_ORDER[a.mode] - MODE_ORDER[b.mode] || b.score - a.score);
  } else {
    best = selectDiverse(ranked, tiers, size);
  }

  const all = new Map();
  const finalize = (c) => {
    if (!all.has(c.idea.id)) {
      c.why = explain(c, profile);
      all.set(c.idea.id, c);
    }
    return all.get(c.idea.id);
  };
  best = best.map(finalize);

  const take = (list, k = 10) => list.slice(0, k).map(finalize);
  const sections = {
    best,
    relevant: take(ranked.slice().sort((a, b) => b.relevance - a.relevance || b.score - a.score), 12),
    budget: tiers.map((t) => ({ ...t, items: take(ranked.filter((c) => c.tier === t.id), 4) })).filter((t) => t.items.length),
    original: take(ranked.filter((c) => c.idea.o >= 4)),
    experiences: take(ranked.filter((c) => c.idea.y === 'experience' || c.idea.y === 'atelier')),
    personal: take(ranked.filter((c) => c.idea.tg.includes('personnalise') || (c.idea.tn.includes('personnel') && c.idea.tn.includes('sentimental')))),
    premium: take(ranked.filter((c) => c.tier === 'high' || c.idea.tg.includes('premium')), 8),
    unexpected: take(ranked.filter((c) => c.mode === 'extra' || c.r.adjacent), 8),
    over: take(dedupe(over.sort((a, b) => b.score - a.score)), 6),
  };

  return { best, ranked, sections, budget, tiers, total: ranked.length };
}
