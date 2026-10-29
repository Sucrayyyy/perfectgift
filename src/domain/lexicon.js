// Compréhension locale du texte libre : normalisation, mots-clés et lexique de synonymes → tags.
// Volontairement simple et déterministe ; une analyse par IA peut s'y ajouter côté serveur (voir server/).

export function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9&+\s-]/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP = new Set(`
a au aux avec ce ces cet cette c d de des du elle elles en et est etre etc il ils je j l la le les leur leurs lui m ma mais me mes moi mon
ne ni nos notre nous on ou par pas pour qu que qui quoi sa se ses si son sur ta te tes toi ton tu un une vos votre vous y
aime aimer aimerait adore adorer adorait beaucoup bien tres trop plus moins tout tous toute toutes fait faire fais deja aussi comme
avoir ai as avait sont suis etait ete chose choses truc trucs envie veut voudrait souhaite parle parler souvent moment
depuis quand toujours jamais rien encore peu petit petite grand grande bon bonne super vraiment cela ca ceci dont
the and of for with to in
`.split(/\s+/).filter(Boolean));

export function stem(word) {
  if (word.length > 4 && /(eaux|aux)$/.test(word)) return word.replace(/x$/, '');
  if (word.length > 3 && /[sx]$/.test(word)) return word.slice(0, -1);
  return word;
}

/** Mots significatifs (≥ 3 lettres, hors mots vides), racinisés. */
export function keywords(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem);
}

// Expressions → tags. Les clés sont déjà normalisées (minuscules, sans accents).
const PHRASES = {
  // Lecture / univers
  'harry potter': ['harrypotter', 'fantasy', 'saga'], poudlard: ['harrypotter', 'fantasy'],
  tolkien: ['lotr', 'fantasy'], 'seigneur des anneaux': ['lotr', 'fantasy'], hobbit: ['lotr', 'fantasy'],
  'star wars': ['starwars', 'sf'], marvel: ['marvel'], 'dc comics': ['marvel'], batman: ['marvel'],
  disney: ['disney'], pixar: ['disney'], ghibli: ['ghibli'], miyazaki: ['ghibli'], totoro: ['ghibli'],
  manga: ['manga'], mangas: ['manga'], 'one piece': ['manga'], naruto: ['manga'], anime: ['ghibli', 'manga'],
  fantasy: ['fantasy'], 'science fiction': ['sf'], sf: ['sf'], dune: ['sf'], polar: ['thriller'], thriller: ['thriller'],
  romance: ['romance'], bd: ['bd'], comics: ['bd'], 'bande dessinee': ['bd'], poesie: ['poesie'],
  kindle: ['liseuse'], kobo: ['liseuse'], liseuse: ['liseuse'], audible: ['audio'], 'livre audio': ['audio'], podcast: ['audio'],
  lecture: ['lecture'], lire: ['lecture'], livre: ['lecture'], livres: ['lecture'], roman: ['lecture'], romans: ['lecture'],
  // Gaming
  zelda: ['switch', 'aventure'], mario: ['switch'], nintendo: ['switch'], switch: ['switch'], pokemon: ['switch', 'tcg'],
  playstation: ['playstation'], ps5: ['playstation'], ps4: ['playstation'], xbox: ['xbox'], steam: ['pc'], 'pc gamer': ['pc'],
  fifa: ['jeux-sport', 'foot'], 'ea sports fc': ['jeux-sport', 'foot'], 'call of duty': ['competitif'], fortnite: ['competitif'],
  valorant: ['competitif', 'pc'], 'league of legends': ['competitif', 'pc'], 'elden ring': ['rpg'], 'final fantasy': ['rpg'],
  minecraft: ['cosy', 'lego'], 'animal crossing': ['cosy', 'switch'], 'stardew valley': ['cosy', 'independant'], retro: ['retro'],
  gameboy: ['retro'], 'jeux video': ['gaming'], 'jeu video': ['gaming'], gamer: ['gaming'], gaming: ['gaming'], console: ['gaming'],
  // Sport
  foot: ['foot'], football: ['foot'], psg: ['foot', 'fan'], 'olympique de marseille': ['foot', 'fan'], om: ['foot', 'fan'], ol: ['foot', 'fan'],
  'real madrid': ['foot', 'fan'], barca: ['foot', 'fan'], mbappe: ['foot', 'fan'], 'ligue des champions': ['foot', 'fan'],
  rugby: ['rugby'], 'stade toulousain': ['rugby', 'fan'], running: ['running'], courir: ['running'], 'course a pied': ['running'],
  marathon: ['running'], trail: ['running', 'randonnee'], footing: ['running'], velo: ['velo'], cyclisme: ['velo'], vtt: ['vtt', 'velo'],
  tennis: ['tennis'], padel: ['tennis'], basket: ['basket'], nba: ['basket', 'fan'], muscu: ['fitness'], musculation: ['fitness'],
  crossfit: ['fitness'], 'salle de sport': ['fitness'], fitness: ['fitness'], yoga: ['yoga'], pilates: ['yoga'], natation: ['natation'],
  piscine: ['natation'], ski: ['ski'], snowboard: ['ski'], escalade: ['escalade'], grimpe: ['escalade'], 'du bloc': ['escalade'],
  golf: ['golf'], boxe: ['combat'], judo: ['combat'], karate: ['combat'], equitation: ['equitation', 'cheval'], poney: ['equitation', 'cheval'],
  f1: ['f1'], 'formule 1': ['f1'], rallye: ['f1'],
  // Musique
  vinyle: ['vinyle'], vinyles: ['vinyle', 'vinyles'], platine: ['vinyle'], concert: ['concerts'], concerts: ['concerts'], festival: ['concerts'],
  guitare: ['guitare', 'instrument'], piano: ['piano', 'instrument'], batterie: ['batterie', 'instrument'], ukulele: ['ukulele', 'instrument'],
  chanter: ['chant'], chant: ['chant'], rap: ['rap'], rock: ['rock'], jazz: ['jazz'], electro: ['electro'], techno: ['electro'],
  'k pop': ['kpop'], kpop: ['kpop'], bts: ['kpop'], spotify: ['streaming'], deezer: ['streaming'], musique: ['musique'],
  // Cinéma
  netflix: ['streaming', 'series'], serie: ['series'], series: ['series'], cinema: ['salle'], film: ['cinema'], films: ['cinema'],
  horreur: ['horreur'], documentaire: ['documentaire'],
  // Cuisine
  cafe: ['cafe'], expresso: ['cafe'], espresso: ['cafe'], barista: ['cafe'], 'du the': ['the'], 'de the': ['the'], 'the vert': ['the'], 'the noir': ['the'], theiere: ['the'], matcha: ['the'], infusion: ['the'],
  vin: ['vin', 'alcool'], oenologie: ['vin', 'alcool'], champagne: ['vin', 'alcool'], whisky: ['spiritueux', 'alcool'], rhum: ['spiritueux', 'alcool'],
  gin: ['cocktails', 'alcool'], biere: ['biere', 'alcool'], cocktail: ['cocktails', 'alcool'], cocktails: ['cocktails', 'alcool'],
  chocolat: ['chocolat'], patisserie: ['patisserie'], gateau: ['patisserie'], gateaux: ['patisserie'], cuisine: ['cuisiner'], cuisiner: ['cuisiner'],
  sushi: ['monde', 'japon'], japonais: ['monde', 'japon'], ramen: ['monde', 'japon'], italien: ['monde'], pizza: ['monde'],
  barbecue: ['barbecue'], bbq: ['barbecue'], plancha: ['barbecue'], fromage: ['gastronomie'], gastronomie: ['gastronomie'],
  // Voyage
  voyage: ['voyage'], voyager: ['voyage'], japon: ['japon', 'voyage'], tokyo: ['japon', 'voyage'], islande: ['voyage', 'aventure'],
  'new york': ['voyage', 'city-break'], italie: ['voyage'], 'road trip': ['roadtrip'], vanlife: ['roadtrip'], 'van amenage': ['roadtrip'], plage: ['plage'],
  randonnee: ['randonnee', 'rando'], rando: ['randonnee', 'rando'], trek: ['randonnee', 'aventure'], montagne: ['randonnee', 'montagne'],
  // Création
  photo: ['photo'], photographie: ['photo'], argentique: ['photo', 'vintage'], polaroid: ['photo'], video: ['video'], youtube: ['video'],
  dessin: ['dessin'], dessiner: ['dessin'], peinture: ['dessin'], aquarelle: ['dessin'], tricot: ['couture'], crochet: ['couture'],
  couture: ['couture'], poterie: ['ceramique'], ceramique: ['ceramique'], bricolage: ['diy'], diy: ['diy'], ecrire: ['ecriture'],
  ecriture: ['ecriture'], journal: ['ecriture'], calligraphie: ['ecriture', 'dessin'],
  // Art
  musee: ['musees'], musees: ['musees'], expo: ['musees'], exposition: ['musees'], theatre: ['theatre'], opera: ['opera'], ballet: ['opera'],
  danse: ['opera'], 'street art': ['street-art'], banksy: ['street-art'], histoire: ['histoire'], chateau: ['histoire'], architecture: ['architecture'],
  // Animaux
  chien: ['chien'], chiot: ['chien'], chat: ['chat'], chaton: ['chat'], cheval: ['cheval'], chevaux: ['cheval'], oiseau: ['oiseaux'],
  oiseaux: ['oiseaux', 'ornithologie'], lapin: ['nac'], hamster: ['nac'],
  // Déco / maison
  plante: ['plantes'], plantes: ['plantes'], jardin: ['jardinage', 'jardin'], jardinage: ['jardinage'], potager: ['jardinage'],
  bougie: ['cosy'], bougies: ['cosy'], plaid: ['cosy'], cocooning: ['cosy'], deco: ['deco'], decoration: ['deco'], scandinave: ['scandinave'],
  // Collection
  lego: ['lego'], figurine: ['figurines'], figurines: ['figurines'], funko: ['figurines'], 'cartes pokemon': ['tcg'], magic: ['tcg'],
  collection: ['collection'], collectionne: ['collection'], timbres: ['numismatique'], 'pieces de monnaie': ['numismatique'], numismatique: ['numismatique'], montre: ['montres'],
  montres: ['montres'], sneakers: ['sneakers'], baskets: ['sneakers'], jordan: ['sneakers'], 'air max': ['sneakers'], 'new balance': ['sneakers'],
  nike: ['sneakers', 'sportswear'], adidas: ['sneakers', 'sportswear'],
  // Nature
  camping: ['camping'], bivouac: ['camping'], peche: ['peche'], astronomie: ['astronomie'], etoiles: ['astronomie'], telescope: ['astronomie'],
  surf: ['glisse'], kayak: ['glisse'], paddle: ['glisse'], nature: ['nature'],
  // Tech
  apple: ['apple'], iphone: ['apple'], ipad: ['apple'], mac: ['apple'], macbook: ['apple'], android: ['android'], samsung: ['android'],
  casque: ['audio'], ecouteurs: ['audio'], airpods: ['audio', 'apple'], enceinte: ['audio'], domotique: ['maison-connectee'],
  drone: ['gadgets', 'photo-video'], gadget: ['gadgets'], gadgets: ['gadgets'], teletravail: ['productivite'], bureau: ['productivite'],
  // Beauté / bien-être
  parfum: ['parfum'], parfums: ['parfum'], maquillage: ['maquillage'], skincare: ['soin-visage'], spa: ['spa'], massage: ['spa'],
  hammam: ['spa'], meditation: ['meditation'], sommeil: ['meditation'], stress: ['meditation', 'spa'], 'bien etre': ['spa', 'meditation'],
  // Jeux de société
  'jeux de societe': ['jeux'], 'jeu de societe': ['jeux'], catan: ['strategie'], dixit: ['ambiance'], codenames: ['ambiance'],
  'escape game': ['enquete'], enquete: ['enquete'], 'jeu de role': ['jeux-role'], donjons: ['jeux-role'], puzzle: ['puzzle'], puzzles: ['puzzle'],
  echecs: ['strategie'],
  // Valeurs
  ecologie: ['eco'], ecolo: ['eco'], 'zero dechet': ['eco'], durable: ['eco'], vegan: ['eco'], vintage: ['vintage'], 'seconde main': ['vintage'],
  bebe: ['bebe'], naissance: ['bebe'],
};

const PHRASE_KEYS = Object.keys(PHRASES).sort((a, b) => b.length - a.length);

/** Tags détectés dans un texte libre (expressions multi-mots d'abord). */
export function extractTags(text) {
  const norm = ` ${normalize(text)} `;
  const found = new Set();
  for (const key of PHRASE_KEYS) {
    if (norm.includes(` ${key} `)) for (const tag of PHRASES[key]) found.add(tag);
  }
  return found;
}

/** Retrouve dans le texte d'origine l'expression qui a déclenché un mot-clé (pour citer l'utilisateur). */
export function findMention(text, words) {
  const norm = normalize(text);
  for (const w of words) {
    const re = new RegExp(`\\b(${w}[a-z]*)\\b`);
    const m = norm.match(re);
    if (m) return m[1];
  }
  return null;
}
