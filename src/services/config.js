// Configuration PUBLIQUE de l'application. Ne jamais mettre de clé secrète ici :
// ce fichier est servi tel quel au navigateur. Les clés vivent côté serveur (voir server/README.md).
export const CONFIG = {
  // URL du serveur PerfectGift (proxy des API marchandes). Vide = mode démo explicite.
  // Exemple : 'https://perfectgift-api.votre-compte.workers.dev'
  apiBase: '',
  // Délai maximal d'attente des offres marchandes avant repli sur le mode démo.
  timeoutMs: 9000,
};
