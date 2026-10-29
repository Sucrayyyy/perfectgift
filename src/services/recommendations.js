// Couche de services : relie le moteur (logique métier) aux sources de données.
//
// - Mode « démo » (par défaut) : le moteur classe le catalogue local d'idées. Les prix sont indicatifs,
//   les liens ouvrent une recherche chez le marchand. L'interface le signale partout.
// - Mode « connecté » (CONFIG.apiBase renseigné) : les idées retenues servent de pistes ; le serveur
//   interroge les sources marchandes autorisées et renvoie de vraies offres (prix, lien exact, image,
//   disponibilité, date de vérification). Sans réponse valide, on retombe proprement sur le mode démo.
import { CONFIG } from './config.js';
import { DEMO_CATALOG } from '../data/catalog.demo.js';
import { searchLinks } from '../data/merchants.js';
import { INTERESTS, TAG_INTERESTS } from '../domain/interests.js';
import { buildProfile } from '../domain/profile.js';
import { recommend } from '../domain/engine.js';

export const DATA_MODE = CONFIG.apiBase ? 'live' : 'demo';
const api = (path) => `${CONFIG.apiBase.replace(/\/$/, '')}${path}`;

function uniqueCandidates(result) {
  const map = new Map();
  const add = (c) => map.set(c.idea.id, c);
  result.best.forEach(add);
  for (const [key, value] of Object.entries(result.sections)) {
    if (key === 'budget') value.forEach((t) => t.items.forEach(add));
    else value.forEach(add);
  }
  return [...map.values()];
}

/** Une offre n'est affichée que si elle est complète et vérifiable. */
export function isValidOffer(o) {
  return !!(o && o.title && o.url && /^https:\/\//.test(o.url) && typeof o.price === 'number' && o.price > 0 && o.merchant && o.checkedAt);
}

async function attachOffers(result) {
  const candidates = uniqueCandidates(result);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), CONFIG.timeoutMs);
  try {
    const res = await fetch(api('/api/offers'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        budget: result.budget,
        queries: candidates.map((c) => ({ id: c.idea.id, q: c.idea.q, merchants: c.idea.m, maxPrice: result.budget[1] })),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let count = 0;
    for (const c of candidates) {
      const offers = (data.offers?.[c.idea.id] || []).filter(isValidOffer).filter((o) => o.price <= result.budget[1] || result.allowOver);
      if (offers.length) {
        c.offers = offers.sort((a, b) => a.price - b.price);
        count++;
      }
    }
    return count;
  } finally {
    clearTimeout(timer);
  }
}

/** Mode connecté : l'IA côté serveur traduit le texte libre en tags connus du moteur (jamais en produits). */
async function analyzeFreeText(answers) {
  const text = [answers.story, answers.talks, answers.wishes, answers.brands, ...(answers.customInterests || [])].filter(Boolean).join('\n');
  if (!text.trim()) return [];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(api('/api/analyze'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, vocabulary: [...INTERESTS.map((i) => i.id), ...Object.keys(TAG_INTERESTS)] }),
      signal: ctrl.signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.tags) ? data.tags : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function getRecommendations(answers, adjustments) {
  const extraTags = DATA_MODE === 'live' ? await analyzeFreeText(answers) : [];
  const profile = buildProfile(answers, { extraTags });
  const result = recommend(profile, DEMO_CATALOG, adjustments);
  result.allowOver = profile.allowOver;
  let mode = DATA_MODE;
  let liveCount = 0;
  if (DATA_MODE === 'live') {
    try {
      liveCount = await attachOffers(result);
      if (!liveCount) mode = 'demo-fallback';
    } catch (err) {
      console.warn('Offres marchandes indisponibles, repli sur le mode démo', err);
      mode = 'demo-fallback';
    }
  }
  return { profile, result, mode, liveCount };
}

/** Liens d'achat d'une idée : offres vérifiées si disponibles, sinon recherches chez les marchands. */
export function purchaseLinks(candidate) {
  if (candidate.offers?.length) {
    return candidate.offers.map((o) => ({ ...o, type: 'offer' }));
  }
  return searchLinks(candidate.idea);
}
