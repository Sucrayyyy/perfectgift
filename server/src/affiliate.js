// Liens partenaires : on ne réécrit une URL que si un identifiant est configuré, et on le signale
// (`affiliate: true`) pour que l'app affiche la mention « lien partenaire ».
export function withAffiliate(offer, env) {
  try {
    const url = new URL(offer.url);
    if (env.AMAZON_PARTNER_TAG && /(^|\.)amazon\.fr$/.test(url.hostname)) {
      url.searchParams.set('tag', env.AMAZON_PARTNER_TAG);
      return { ...offer, url: url.toString(), affiliate: true };
    }
    // Exemple Awin (Fnac, Cultura, Boulanger… selon vos programmes) : lien profond de redirection
    const awin = env.AWIN_PUBLISHER_ID && env.AWIN_MERCHANTS ? JSON.parse(env.AWIN_MERCHANTS) : null;
    const merchantId = awin?.[url.hostname.replace(/^www\./, '')];
    if (merchantId) {
      const deep = `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${env.AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(offer.url)}`;
      return { ...offer, url: deep, affiliate: true };
    }
  } catch {
    /* URL invalide : on laisse l'offre telle quelle, elle sera filtrée côté app si besoin */
  }
  return offer;
}
