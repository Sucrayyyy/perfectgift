// Adaptateur Google Shopping via SerpApi (https://serpapi.com/google-shopping-api).
// ⚠️ Non testé sans clé : vérifiez les champs de réponse avec votre compte avant la mise en production.
export async function serpApiShopping(query, env) {
  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query.q,
    gl: 'fr',
    hl: 'fr',
    location: 'France',
    api_key: env.SERPAPI_KEY,
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`, { cf: { cacheTtl: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  const checkedAt = new Date().toISOString();
  return (data.shopping_results || []).slice(0, 8).map((r) => ({
    title: r.title,
    price: typeof r.extracted_price === 'number' ? r.extracted_price : null,
    currency: 'EUR',
    merchant: r.source,
    // Lien direct vers la fiche du vendeur quand il est fourni, sinon la fiche comparateur
    url: r.link || r.product_link,
    image: r.thumbnail || null,
    availability: 'unknown',
    affiliate: false,
    checkedAt,
    source: 'google_shopping',
  })).filter((o) => o.price && o.url && o.merchant);
}
