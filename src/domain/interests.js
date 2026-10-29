// Centres d'intérêt et questions d'approfondissement.
// Chaque option sélectionnée devient un « tag » que le moteur rapproche des tags du catalogue.
// Les champs texte ont un rôle : favs (références aimées), owned (déjà possédé), brands (convoité),
// dream (rêve, envie forte), pet (prénom de l'animal), notes (informations utiles, ex. tailles).
import { isChild, isMinor } from './options.js';

const o = (v, l) => ({ v, l });

export const INTERESTS = [
  {
    id: 'sport', l: 'Sport & fitness', phrase: 'le sport', hue: ['#DDF5EA', '#A8E6CF', '#7FD1B9'],
    adj: ['nature', 'beaute', 'voyage'],
    deepTitle: 'Parlons sport',
    deep: [
      { type: 'chips', key: 'sport_which', label: 'Quel(s) sport(s) ?', multi: true, options: [
        o('foot', 'Football'), o('running', 'Running'), o('velo', 'Vélo'), o('tennis', 'Tennis / padel'),
        o('basket', 'Basket'), o('fitness', 'Muscu / fitness'), o('yoga', 'Yoga / pilates'), o('natation', 'Natation'),
        o('rugby', 'Rugby'), o('ski', 'Ski / snow'), o('escalade', 'Escalade'), o('golf', 'Golf'),
        o('combat', 'Sports de combat'), o('equitation', 'Équitation'),
      ] },
      { type: 'chips', key: 'sport_mode', label: 'Pratique ou regarde ?', options: [
        o('pratique', 'Pratique'), o('spectateur', 'Regarde / supporte'), o('les-deux', 'Les deux'),
      ] },
      { type: 'text', key: 'sport_team', role: 'favs', label: 'Équipe ou athlète préféré', placeholder: 'ex. Stade Toulousain, PSG, Kylian Mbappé…' },
      { type: 'chips', key: 'sport_pref', label: 'Ce qui lui ferait plaisir', multi: true, options: [
        o('sport-collection', 'Objets de collection'), o('sport-textile', 'Vêtements'),
        o('sport-equipement', 'Accessoires / équipement'), o('sport-experience', 'Expériences sportives'),
      ] },
      { type: 'text', key: 'sport_owned', role: 'owned', label: 'Équipement déjà possédé', placeholder: 'ex. montre GPS, raquette…' },
    ],
  },
  {
    id: 'gaming', l: 'Jeux vidéo', phrase: 'les jeux vidéo', hue: ['#E6E0FF', '#C3B5FF', '#9F8CFF'],
    adj: ['tech', 'cinema', 'jeux', 'collection'],
    deepTitle: 'Côté gaming',
    deep: [
      { type: 'chips', key: 'gaming_platform', label: 'Sur quelle(s) plateforme(s) ?', multi: true, options: [
        o('pc', 'PC'), o('playstation', 'PlayStation'), o('xbox', 'Xbox'), o('switch', 'Nintendo Switch'),
        o('mobile', 'Mobile'), o('retro', 'Rétro'),
      ] },
      { type: 'chips', key: 'gaming_genres', label: 'Ses genres de prédilection', multi: true, options: [
        o('competitif', 'Compétitif / FPS'), o('rpg', 'RPG'), o('narratif', 'Narratif'), o('jeux-sport', 'Sport / course'),
        o('independant', 'Indé'), o('aventure', 'Aventure'), o('cosy', 'Cosy / gestion'), o('horreur', 'Horreur'),
      ] },
      { type: 'text', key: 'gaming_favs', role: 'favs', label: 'Ses jeux préférés', placeholder: 'ex. Zelda, FC 25, Elden Ring, Animal Crossing…' },
      { type: 'text', key: 'gaming_owned', role: 'owned', label: 'Matériel déjà possédé', placeholder: 'ex. casque, manette pro, volant…' },
    ],
  },
  {
    id: 'cinema', l: 'Cinéma & séries', phrase: 'le cinéma et les séries', hue: ['#FFE3E3', '#FFB8B8', '#FF8F8F'],
    adj: ['art', 'lecture', 'gaming'],
    deepTitle: 'Ses films & séries',
    deep: [
      { type: 'chips', key: 'cinema_genres', label: 'Genres favoris', multi: true, options: [
        o('sf', 'Science-fiction'), o('fantasy', 'Fantasy'), o('horreur', 'Horreur'), o('comedie', 'Comédie'),
        o('thriller', 'Thriller / polar'), o('animation', 'Animation'), o('documentaire', 'Documentaire'), o('romance', 'Romance'),
        o('auteur', "Films d'auteur"),
      ] },
      { type: 'chips', key: 'cinema_univers', label: 'Un univers culte ?', multi: true, options: [
        o('marvel', 'Marvel / DC'), o('starwars', 'Star Wars'), o('harrypotter', 'Harry Potter'), o('lotr', 'Seigneur des Anneaux'),
        o('disney', 'Disney / Pixar'), o('ghibli', 'Ghibli / anime'), o('series', 'Séries cultes'),
      ] },
      { type: 'chips', key: 'cinema_format', label: 'Au cinéma ou à la maison ?', multi: true, options: [
        o('salle', 'Au cinéma'), o('streaming', 'En streaming'), o('homecinema', 'Home-cinéma'),
      ] },
      { type: 'text', key: 'cinema_favs', role: 'favs', label: 'Films ou séries préférés', placeholder: 'ex. Dune, The Office, Le Voyage de Chihiro…' },
    ],
  },
  {
    id: 'musique', l: 'Musique & concerts', phrase: 'la musique', hue: ['#FFE9F3', '#FFC2DC', '#FF9CC6'],
    adj: ['art', 'tech', 'collection'],
    deepTitle: 'Sa musique',
    deep: [
      { type: 'chips', key: 'musique_genres', label: 'Ses styles', multi: true, options: [
        o('pop', 'Pop'), o('rock', 'Rock'), o('rap', 'Rap / hip-hop'), o('electro', 'Électro'),
        o('jazz', 'Jazz'), o('classique', 'Classique'), o('metal', 'Metal'), o('chanson', 'Chanson française'),
        o('soul', 'Soul / R&B'), o('kpop', 'K-pop'),
      ] },
      { type: 'chips', key: 'musique_ecoute', label: 'Sa façon de vivre la musique', multi: true, options: [
        o('vinyle', 'Vinyles'), o('streaming', 'Streaming'), o('concerts', 'Concerts / festivals'), o('instrument', 'Joue d\'un instrument'),
      ] },
      { type: 'chips', key: 'musique_instrument', label: 'Quel instrument ?', multi: true, when: (a) => (a.deep.musique_ecoute || []).includes('instrument'), options: [
        o('guitare', 'Guitare'), o('piano', 'Piano'), o('batterie', 'Batterie'), o('chant', 'Chant'), o('ukulele', 'Ukulélé'),
      ] },
      { type: 'text', key: 'musique_favs', role: 'favs', label: 'Artistes ou groupes préférés', placeholder: 'ex. Daft Punk, Angèle, Taylor Swift…' },
    ],
  },
  {
    id: 'lecture', l: 'Lecture', phrase: 'la lecture', hue: ['#FFF1DC', '#FFD9A8', '#F7C07A'],
    adj: ['art', 'cinema', 'voyage', 'photo'],
    deepTitle: 'Ses lectures',
    deep: [
      { type: 'chips', key: 'lecture_genres', label: 'Genres préférés', multi: true, options: [
        o('fantasy', 'Fantasy'), o('romance', 'Romance'), o('thriller', 'Thriller / polar'), o('sf', 'Science-fiction'),
        o('devperso', 'Développement perso'), o('manga', 'Mangas'), o('bd', 'BD / comics'), o('classiques', 'Classiques'),
        o('histoire', 'Histoire'), o('poesie', 'Poésie'), o('jeunesse', 'Jeunesse'),
      ] },
      { type: 'chips', key: 'lecture_format', label: 'Son format', multi: true, options: [
        o('papier', 'Papier'), o('liseuse', 'Liseuse'), o('audio', 'Livres audio'),
      ] },
      { type: 'text', key: 'lecture_favs', role: 'favs', label: 'Auteurs ou livres adorés', placeholder: 'ex. Tolkien, Agatha Christie, One Piece…' },
      { type: 'text', key: 'lecture_saga', role: 'favs', label: 'Une saga adorée ?', placeholder: 'ex. Harry Potter, La Passe-Miroir…' },
      { type: 'toggle', key: 'lecture_avoid_owned', label: 'Éviter les livres déjà possédés', hint: 'On vous demandera lesquels.' },
      { type: 'text', key: 'lecture_owned', role: 'owned', label: 'Livres déjà possédés', placeholder: 'ex. tous les Harry Potter, Dune…', when: (a) => !!a.deep.lecture_avoid_owned },
    ],
  },
  {
    id: 'tech', l: 'Tech & high-tech', phrase: 'la tech', hue: ['#DFF0FF', '#B5DBFF', '#8CC3FF'],
    adj: ['gaming', 'photo', 'musique'],
    deepTitle: 'Côté tech',
    deep: [
      { type: 'chips', key: 'tech_eco', label: 'Son écosystème', options: [
        o('apple', 'Apple'), o('android', 'Android'), o('windows', 'Windows / PC'), o('eco-any', 'Peu importe'),
      ] },
      { type: 'chips', key: 'tech_domaines', label: 'Ses domaines de prédilection', multi: true, options: [
        o('audio', 'Audio'), o('photo-video', 'Photo / vidéo'), o('maison-connectee', 'Maison connectée'),
        o('gadgets', 'Gadgets malins'), o('montre', 'Montres connectées'), o('productivite', 'Bureau / productivité'),
      ] },
      { type: 'text', key: 'tech_owned', role: 'owned', label: 'Déjà possédé', placeholder: 'ex. AirPods, Apple Watch, enceinte…' },
    ],
  },
  {
    id: 'mode', l: 'Mode & sneakers', phrase: 'la mode', hue: ['#F5E6FF', '#E2C2FF', '#CF9EFF'],
    adj: ['beaute', 'luxe', 'art'],
    deepTitle: 'Son style',
    deep: [
      { type: 'chips', key: 'mode_style', label: 'Son style vestimentaire', multi: true, options: [
        o('streetwear', 'Streetwear'), o('chic', 'Chic / classique'), o('sportswear', 'Sportswear'), o('boheme', 'Bohème'),
        o('minimaliste', 'Minimaliste'), o('vintage', 'Vintage'), o('luxe-mode', 'Luxe'),
      ] },
      { type: 'chips', key: 'mode_cats', label: 'Ce qui lui ferait plaisir', multi: true, options: [
        o('sneakers', 'Sneakers'), o('vetements', 'Vêtements'), o('accessoires', 'Sacs & accessoires'),
        o('bijoux', 'Bijoux'), o('montres', 'Montres'),
      ] },
      { type: 'text', key: 'mode_brands', role: 'brands', label: 'Marques préférées', placeholder: 'ex. Nike, Sézane, New Balance…' },
      { type: 'text', key: 'mode_owned', role: 'owned', label: 'Modèles déjà possédés', placeholder: 'ex. Air Force 1 blanches…' },
      { type: 'text', key: 'mode_sizes', role: 'notes', label: 'Tailles ou pointure', placeholder: 'ex. M, 39…' },
    ],
  },
  {
    id: 'beaute', l: 'Beauté & bien-être', phrase: 'la beauté et le bien-être', hue: ['#FFE8EE', '#FFC9D6', '#FFA9BE'],
    adj: ['mode', 'voyage', 'nature'],
    deepTitle: 'Beauté & bien-être',
    deep: [
      { type: 'chips', key: 'beaute_cats', label: 'Ses rituels', multi: true, options: [
        o('soin-visage', 'Soin du visage'), o('maquillage', 'Maquillage'), o('parfum', 'Parfum'), o('soin-corps', 'Bain & corps'),
        o('cheveux', 'Cheveux'), o('spa', 'Spa / massage'), o('meditation', 'Méditation / sommeil'),
      ] },
      { type: 'text', key: 'beaute_brands', role: 'brands', label: 'Marques fétiches', placeholder: 'ex. Caudalie, Typology, Diptyque…' },
    ],
  },
  {
    id: 'cuisine', l: 'Cuisine & gastronomie', phrase: 'la cuisine', hue: ['#FFF0E0', '#FFD3A8', '#FFB774'],
    adj: ['voyage', 'deco', 'nature'],
    deepTitle: 'Côté cuisine',
    deep: [
      { type: 'chips', key: 'cuisine_cats', label: 'Ses gourmandises', multi: true, options: [
        o('cuisiner', 'Cuisiner'), o('patisserie', 'Pâtisserie'), o('vin', 'Vin'), o('biere', 'Bière craft'),
        o('cafe', 'Café'), o('the', 'Thé'), o('chocolat', 'Chocolat'), o('monde', 'Cuisines du monde'),
        o('barbecue', 'Barbecue'), o('cocktails', 'Cocktails'),
      ] },
      { type: 'chips', key: 'cuisine_level', label: 'Son niveau', options: [
        o('cuisine-debutant', 'Débutant·e'), o('cuisine-passionne', 'Passionné·e'), o('cuisine-chef', 'Quasi-chef'),
      ] },
      { type: 'text', key: 'cuisine_owned', role: 'owned', label: 'Matériel déjà possédé', placeholder: 'ex. robot pâtissier, machine à café…' },
    ],
  },
  {
    id: 'voyage', l: 'Voyages & découvertes', phrase: 'les voyages', hue: ['#DFF7FF', '#ABE7FA', '#7DD6F2'],
    adj: ['photo', 'nature', 'cuisine', 'art'],
    deepTitle: 'Ses voyages',
    deep: [
      { type: 'chips', key: 'voyage_style', label: 'Son style de voyage', multi: true, options: [
        o('city-break', 'City-break'), o('rando', 'Nature / rando'), o('plage', 'Plage'), o('roadtrip', 'Road-trip'),
        o('aventure', 'Aventure'), o('culture', 'Culture & musées'),
      ] },
      { type: 'text', key: 'voyage_dream', role: 'dream', label: 'Une destination rêvée ?', placeholder: 'ex. Japon, Islande, New York…' },
    ],
  },
  {
    id: 'photo', l: 'Photo & création', phrase: 'la création', hue: ['#FFF5D6', '#FFE39A', '#FFD25E'],
    adj: ['art', 'voyage', 'deco'],
    deepTitle: 'Son côté créatif',
    deep: [
      { type: 'chips', key: 'photo_cats', label: 'Ses créations', multi: true, options: [
        o('photo', 'Photo'), o('video', 'Vidéo'), o('dessin', 'Dessin / peinture'), o('couture', 'Couture / tricot'),
        o('ceramique', 'Céramique'), o('diy', 'DIY / bricolage'), o('ecriture', 'Écriture'),
      ] },
      { type: 'text', key: 'photo_owned', role: 'owned', label: 'Matériel déjà possédé', placeholder: 'ex. reflex, tablette graphique…' },
    ],
  },
  {
    id: 'auto', l: 'Auto & mécanique', phrase: "l'automobile", hue: ['#E6EAF2', '#C5CEDD', '#A3B1C8'],
    adj: ['collection', 'sport', 'tech'],
    deepTitle: 'Moteurs !',
    deep: [
      { type: 'chips', key: 'auto_cats', label: 'Ce qui fait vibrer', multi: true, options: [
        o('sportives', 'Voitures de sport'), o('vintage-auto', 'Anciennes'), o('moto', 'Moto'),
        o('mecanique', 'Mécanique / DIY'), o('f1', 'Sport auto / F1'),
      ] },
      { type: 'text', key: 'auto_favs', role: 'favs', label: 'Marques, modèles ou écurie', placeholder: 'ex. Porsche 911, Ferrari, Alpine…' },
    ],
  },
  {
    id: 'art', l: 'Art & culture', phrase: "l'art et la culture", hue: ['#FBE7FF', '#F0C1FA', '#E39BF2'],
    adj: ['photo', 'voyage', 'lecture', 'musique'],
    deepTitle: 'Art & culture',
    deep: [
      { type: 'chips', key: 'art_cats', label: 'Ses terrains de jeu', multi: true, options: [
        o('musees', 'Musées / expos'), o('theatre', 'Théâtre'), o('opera', 'Opéra / danse'), o('street-art', 'Street art'),
        o('histoire', 'Histoire'), o('architecture', 'Architecture'),
      ] },
      { type: 'text', key: 'art_favs', role: 'favs', label: 'Artistes ou mouvements aimés', placeholder: 'ex. Van Gogh, Banksy, Art déco…' },
    ],
  },
  {
    id: 'animaux', l: 'Animaux', phrase: 'les animaux', hue: ['#FFF0E3', '#FFD6B3', '#F9BC86'],
    adj: ['nature', 'photo', 'deco'],
    deepTitle: 'Ses compagnons',
    deep: [
      { type: 'chips', key: 'animaux_which', label: 'Quels animaux ?', multi: true, options: [
        o('chien', 'Chien'), o('chat', 'Chat'), o('cheval', 'Cheval'), o('oiseaux', 'Oiseaux'),
        o('nac', 'NAC'), o('faune', 'Faune sauvage'),
      ] },
      { type: 'text', key: 'animaux_pet', role: 'pet', label: 'Le nom de son animal', placeholder: 'Pour un cadeau personnalisé (facultatif)' },
    ],
  },
  {
    id: 'deco', l: 'Déco & maison', phrase: 'la déco', hue: ['#F1EDE4', '#E1D6C2', '#CDBE9F'],
    adj: ['art', 'cuisine', 'nature'],
    deepTitle: 'Son intérieur',
    deep: [
      { type: 'chips', key: 'deco_style', label: 'Son style', multi: true, options: [
        o('scandinave', 'Scandinave'), o('boheme-deco', 'Bohème'), o('industriel', 'Industriel'), o('minimal-deco', 'Minimaliste'),
        o('vintage-deco', 'Vintage'), o('cosy', 'Cosy'),
      ] },
      { type: 'chips', key: 'deco_spaces', label: 'Ses pièces favorites', multi: true, options: [
        o('salon', 'Salon'), o('cuisine-deco', 'Cuisine'), o('chambre', 'Chambre'), o('jardin', 'Jardin / balcon'), o('plantes', 'Plantes'),
      ] },
    ],
  },
  {
    id: 'collection', l: 'Collection & objets rares', phrase: 'les collections', hue: ['#E9F0FF', '#C9D8FF', '#A6BEFF'],
    adj: ['art', 'gaming', 'luxe'],
    deepTitle: 'Ses collections',
    deep: [
      { type: 'chips', key: 'collection_what', label: 'Ses collections', multi: true, options: [
        o('figurines', 'Figurines'), o('vinyles', 'Vinyles'), o('tcg', 'Cartes (Pokémon, Magic…)'), o('montres', 'Montres'),
        o('numismatique', 'Pièces / timbres'), o('lego', 'LEGO'), o('sneakers', 'Sneakers'), o('memorabilia', 'Objets dédicacés'),
      ] },
      { type: 'text', key: 'collection_favs', role: 'favs', label: 'Précisions', placeholder: 'ex. figurines Funko Marvel, cartes Pokémon 1re génération…' },
    ],
  },
  {
    id: 'nature', l: 'Nature & plein air', phrase: 'le plein air', hue: ['#E7F7DF', '#C4EBB0', '#9FDC83'],
    adj: ['sport', 'voyage', 'animaux', 'photo'],
    deepTitle: 'Au grand air',
    deep: [
      { type: 'chips', key: 'nature_cats', label: 'Ses activités', multi: true, options: [
        o('randonnee', 'Randonnée'), o('camping', 'Camping / bivouac'), o('jardinage', 'Jardinage'), o('peche', 'Pêche'),
        o('astronomie', 'Astronomie'), o('ornithologie', 'Observation oiseaux'), o('vtt', 'VTT'), o('glisse', 'Kayak / surf'),
      ] },
    ],
  },
  {
    id: 'jeux', l: 'Jeux de société', phrase: 'les jeux de société', hue: ['#FFEFE0', '#FFD2B0', '#FFB582'],
    adj: ['gaming', 'collection', 'art'],
    deepTitle: 'Autour de la table',
    deep: [
      { type: 'chips', key: 'jeux_types', label: 'Ses types de jeux', multi: true, options: [
        o('strategie', 'Stratégie'), o('ambiance', 'Ambiance / party'), o('cooperatif', 'Coopératifs'), o('enquete', 'Enquête / escape'),
        o('duo', 'Jeux à deux'), o('familial', 'Familiaux'), o('jeux-role', 'Jeu de rôle'), o('puzzle', 'Puzzles'),
      ] },
      { type: 'text', key: 'jeux_favs', role: 'owned', label: 'Jeux déjà possédés', placeholder: 'ex. Catan, Dixit, Codenames…' },
    ],
  },
  {
    id: 'luxe', l: 'Luxe & premium', phrase: 'les beaux objets', hue: ['#F7F0DC', '#EBD9A7', '#DDBF72'],
    adj: ['mode', 'beaute', 'collection'],
    minAge: 18,
    deepTitle: 'Le goût du beau',
    deep: [
      { type: 'chips', key: 'luxe_cats', label: 'Ses envies premium', multi: true, options: [
        o('maroquinerie', 'Maroquinerie'), o('montres-luxe', 'Montres'), o('bijoux-luxe', 'Bijoux'), o('parfum-niche', 'Parfums de niche'),
        o('gastronomie-luxe', "Gastronomie d'exception"), o('tech-premium', 'Tech premium'),
      ] },
      { type: 'text', key: 'luxe_brands', role: 'brands', label: 'Maisons ou marques convoitées', placeholder: 'ex. Cartier, Le Labo, Bang & Olufsen…' },
    ],
  },
];

export const GENERIC_HUE = ['#FFE8DC', '#FFD0BF', '#FFB59C'];

export const INTEREST_BY_ID = Object.fromEntries(INTERESTS.map((i) => [i.id, i]));

/** Passions proposées selon l'âge (bébés : univers d'éveil ; mineurs : pas de luxe). */
export function interestsFor(answers) {
  if (answers.ageBand === '0-2') {
    return INTERESTS.filter((i) => ['animaux', 'musique', 'lecture', 'nature', 'deco'].includes(i.id));
  }
  return INTERESTS.filter((i) => {
    if (i.minAge && isMinor(answers)) return false;
    if (i.id === 'luxe' && isChild(answers)) return false;
    return true;
  });
}

/** Libellé lisible d'un tag (pour les explications). */
const TAG_LABELS = (() => {
  const map = {};
  for (const interest of INTERESTS) {
    for (const field of interest.deep) {
      for (const opt of field.options || []) map[opt.v] = opt.l;
    }
  }
  return map;
})();

export function tagLabel(tag) {
  return TAG_LABELS[tag] || null;
}

/** Tag → centres d'intérêt où il apparaît (sert à relier un mot du texte libre à une passion). */
export const TAG_INTERESTS = (() => {
  const map = {};
  for (const interest of INTERESTS) {
    for (const field of interest.deep) {
      for (const opt of field.options || []) (map[opt.v] ||= new Set()).add(interest.id);
    }
  }
  return map;
})();

/** Passion → ensemble des tags de ses questions d'approfondissement. */
export const INTEREST_OPTIONS = Object.fromEntries(
  INTERESTS.map((i) => [i.id, new Set(i.deep.flatMap((f) => (f.options || []).map((o) => o.v)))])
);
