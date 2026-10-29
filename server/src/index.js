// PerfectGift API — Cloudflare Worker (optionnel).
// Rôle : garder les clés secrètes côté serveur et parler aux sources de données vérifiables.
//   POST /api/offers   → transforme des pistes de cadeaux en offres réelles (prix, lien exact, image, dispo)
//   POST /api/analyze  → comprend le texte libre (IA) et le traduit en tags connus du moteur
//   GET  /api/health   → sources configurées
import { findOffers, configuredProviders } from './providers/index.js';
import { analyzeText } from './analyze.js';

const MAX_QUERIES = 40;

function cors(env, origin) {
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return {
    'access-control-allow-origin': ok ? origin : allowed[0] || 'null',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

const json = (data, status, headers) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = cors(env, request.headers.get('origin') || '');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

    try {
      if (url.pathname === '/api/health') {
        return json({ ok: true, providers: configuredProviders(env), analyze: !!env.ANTHROPIC_API_KEY }, 200, headers);
      }

      if (url.pathname === '/api/offers' && request.method === 'POST') {
        const body = await request.json();
        const queries = Array.isArray(body.queries) ? body.queries.slice(0, MAX_QUERIES) : [];
        const offers = {};
        // Requêtes en parallèle, par petits lots pour respecter les quotas des fournisseurs
        for (let i = 0; i < queries.length; i += 8) {
          const batch = queries.slice(i, i + 8);
          const results = await Promise.all(batch.map((q) => findOffers(q, env).catch(() => [])));
          batch.forEach((q, k) => (offers[q.id] = results[k]));
        }
        return json({ offers }, 200, headers);
      }

      if (url.pathname === '/api/analyze' && request.method === 'POST') {
        const { text, vocabulary } = await request.json();
        if (!env.ANTHROPIC_API_KEY) return json({ tags: [] }, 200, headers);
        const tags = await analyzeText(String(text || '').slice(0, 4000), Array.isArray(vocabulary) ? vocabulary : [], env);
        return json({ tags }, 200, headers);
      }

      return json({ error: 'not_found' }, 404, headers);
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error' }, 500, headers);
    }
  },
};
