// Illustrations maison : chaque idée est représentée par l'objet qui la résume (vinyle, casque, billet…),
// posé au centre d'un « paquet » aux couleurs de sa passion. Aucun emoji, un seul style de trait.
import { h } from '../../core/dom.js';
import { iconSvg } from '../../core/icons.js';
import { normalize } from '../../domain/lexicon.js';
import { INTEREST_BY_ID, GENERIC_HUE } from '../../domain/interests.js';

// Du plus spécifique au plus général : le premier motif trouvé (en début de mot) dans le titre ou la requête l'emporte.
const RULES = [
  ['vinyle|platine', 'vinyl'],
  ['casques?\\b|ecouteur|enceinte|radio', 'headphones'],
  ['montres?\\b', 'watch'],
  ['parapluie', 'umbrella'],
  ['montgolfiere|helicoptere', 'balloon'],
  ['tentes?\\b|bivouac|camping|rechaud', 'tent'],
  ['velo|cyclis', 'bike'],
  ['telescope|etoiles|astronom|carte du ciel', 'telescope'],
  ['parfum|diffuseur', 'bottle'],
  ['bougie', 'candle'],
  ['lego|brique', 'blocks'],
  ['sneakers|chaussons', 'shoe'],
  ['maillot|t shirt|echarpe|casquette|veste', 'mode'],
  ['billet|places|concert|festival|grand prix|theatre|opera|ballet|carte cinema|visite', 'ticket'],
  ['vins?\\b|champagne|cocktail|biere|mixologie', 'wine'],
  ['cafe|barista|the d|theiere|mug', 'coffee'],
  ['chocolat|patisserie|gateau', 'cake'],
  ['appareil photo|objectif|argentique|drone|stabilisateur|seance photo|createur de contenu|stage photo|developpement', 'photo'],
  ['plante|bouquet|graines|olivier|arbre|terrarium|potager|jardinage', 'leaf'],
  ['carte du monde|destination|langue|week end|train|voyage', 'map'],
  ['couteau|cocotte|plancha|sushi|cuisine|fermentation|recettes|fromage|caviar|sauces|panier|epicerie', 'cuisine'],
  ['affiche|portrait|tirage|illustration|aquarelle|peinture|dessin|tablette graphique', 'frame'],
  ['livre|edition|bd\\b|manga|roman|carnet|artbook|poeme|lettres|album|magazine|histoires|ex libris|reliure|ecriture', 'lecture'],
  ['manette|console|jeu switch|jeu video|nouvel opus|abonnement jeux', 'gaming'],
  ['escape|enquete|murder|puzzle|jeu de|jeux|echiquier|boosters', 'jeux'],
  ['chiens?\\b|chats?\\b|animal|zoo|oiseau|nichoir|poney|cheval|peluche|doudou|dinosaure', 'animaux'],
  ['carte cadeau|coffret experience', 'card'],
  ['spa\\b|massage|hammam|flottaison|yoga|meditation|soins?\\b|bain|soie|maquillage|brosse', 'beaute'],
].map(([words, name]) => [new RegExp(`\\b(?:${words})`), name]);

export function ideaIcon(idea) {
  const text = ` ${normalize(`${idea.t} ${idea.q}`)} `;
  for (const [re, name] of RULES) if (re.test(text)) return name;
  return idea.i[0] || 'gift';
}

export function hueFor(idea) {
  return INTEREST_BY_ID[idea.i?.[0]]?.hue || GENERIC_HUE;
}

/** Visuel d'une idée : paquet coloré, objet dessiné au centre du nœud. */
export function giftArt(iconName, { size = 'lg' } = {}) {
  return h('span', { class: ['art-badge', `art-badge--${size}`] },
    h('span', { class: 'art-badge__icon', html: iconSvg(iconName, 1.5) }),
  );
}
