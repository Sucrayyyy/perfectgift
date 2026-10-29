// Registre des sources d'offres. Chaque adaptateur reçoit une piste { id, q, merchants, maxPrice }
// et renvoie des offres au format commun :
//   { title, price, currency, merchant, url, image, availability: 'in_stock'|'unknown', affiliate, checkedAt, source }
// Ajouter une plateforme = écrire un adaptateur et l'ajouter à ADAPTERS. Les offres incomplètes sont ignorées par l'app.
import { serpApiShopping } from './serpapi.js';
import { withAffiliate } from '../affiliate.js';

const ADAPTERS = [
  // Comparateur multi-marchands (Google Shopping via SerpApi) : prix, vendeur, image, lien.
  { id: 'serpapi', enabled: (env) => !!env.SERPAPI_KEY, search: serpApiShopping },
  // À brancher selon vos programmes partenaires :
  // { id: 'amazon-paapi', enabled: (env) => !!env.AMAZON_PAAPI_ACCESS_KEY, search: amazonPaapi },   // Product Advertising API 5.0
  // { id: 'awin', enabled: (env) => !!env.AWIN_API_TOKEN, search: awinProductFeed },                // flux Fnac, Cultura, Boulanger…
  // { id: 'experiences', enabled: (env) => !!env.EXPERIENCES_API_KEY, search: experiencesApi },      // plateformes d'activités
];

export function configuredProviders(env) {
  return ADAPTERS.filter((a) => a.enabled(env)).map((a) => a.id);
}

export async function findOffers(query, env) {
  const active = ADAPTERS.filter((a) => a.enabled(env));
  const results = await Promise.all(active.map((a) => a.search(query, env).catch(() => [])));
  const seen = new Set();
  return results
    .flat()
    .filter((o) => o && o.url && o.price > 0 && (!query.maxPrice || o.price <= query.maxPrice * 1.6))
    .filter((o) => (seen.has(o.url) ? false : seen.add(o.url)))
    .map((o) => withAffiliate(o, env))
    .sort((a, b) => a.price - b.price)
    .slice(0, 4);
}
