// Registre des marchands. Ajouter une plateforme = ajouter une entrée ici (et, en mode connecté,
// un adaptateur côté serveur : voir server/providers/).
//
// En mode démo, `search(q)` ouvre une RECHERCHE chez le marchand : on ne fabrique jamais d'URL
// de fiche produit. Les liens ne sont pas affiliés tant qu'aucun identifiant partenaire n'est configuré.

const enc = encodeURIComponent;

export const MERCHANTS = {
  amazon: { name: 'Amazon', short: 'a', tone: '#2B1846', kind: 'Marketplace', search: (q) => `https://www.amazon.fr/s?k=${enc(q)}` },
  fnac: { name: 'Fnac', short: 'Fn', tone: '#B7791F', kind: 'Culture & tech', search: (q) => `https://www.fnac.com/SearchResult/ResultList.aspx?Search=${enc(q)}` },
  cultura: { name: 'Cultura', short: 'Cu', tone: '#6A48F5', kind: 'Culture & loisirs créatifs', search: (q) => `https://www.cultura.com/search/results?search_query=${enc(q)}` },
  boulanger: { name: 'Boulanger', short: 'Bo', tone: '#E9483A', kind: 'High-tech & électroménager', search: (q) => `https://www.boulanger.com/resultats?tr=${enc(q)}` },
  decathlon: { name: 'Decathlon', short: 'De', tone: '#1C6FB8', kind: 'Sport', search: (q) => `https://www.decathlon.fr/search?Ntt=${enc(q)}` },
  nike: { name: 'Nike', short: 'Ni', tone: '#1F1631', kind: 'Sneakers & sport', search: (q) => `https://www.nike.com/fr/w?q=${enc(q)}` },
  micromania: { name: 'Micromania', short: 'Mi', tone: '#C2285F', kind: 'Jeux vidéo', search: (q) => `https://www.micromania.fr/search?q=${enc(q)}` },
  lego: { name: 'LEGO', short: 'Lg', tone: '#D99418', kind: 'Boutique officielle', search: (q) => `https://www.lego.com/fr-fr/search?q=${enc(q)}` },
  etsy: { name: 'Etsy', short: 'Et', tone: '#E0711C', kind: 'Créateurs & artisans', search: (q) => `https://www.etsy.com/fr/search?q=${enc(q)}` },
  gshop: { name: 'Comparer les prix', short: '€', tone: '#1C8A6E', kind: 'Google Shopping', search: (q) => `https://www.google.com/search?udm=28&q=${enc(q)}` },
  experiences: { name: 'Trouver près de chez vous', short: '', icon: 'map', tone: '#6A48F5', kind: 'Activités & expériences', search: (q) => `https://www.google.com/search?q=${enc(q + ' près de chez moi')}` },
};

export function merchant(id) {
  return MERCHANTS[id] || null;
}

/** Liens de recherche pour une idée (mode démo). */
export function searchLinks(idea) {
  return (idea.m || []).map((id) => {
    const m = MERCHANTS[id];
    if (!m) return null;
    return { id, name: m.name, short: m.short, icon: m.icon, tone: m.tone, kind: m.kind, url: m.search(idea.q || idea.t), type: 'search' };
  }).filter(Boolean);
}
