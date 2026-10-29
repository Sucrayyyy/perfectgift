// Rédige le « Pourquoi ce cadeau ? » à partir des raisons réellement utilisées par le moteur.
// Formulations neutres (pas de pronom genré) : on utilise le prénom, « cette personne » ou des possessifs.
import { INTEREST_BY_ID, tagLabel } from './interests.js';
import { OCCASIONS } from './options.js';
import { normalize, stem } from './lexicon.js';

const TRAIT_TEXT = {
  adv: { 1: "Son goût de l'aventure y trouvera de quoi vibrer.", '-1': 'Parfait pour son amour du cocon.' },
  emo: { 1: 'Un cadeau qui parle au cœur avant tout.', '-1': 'Du concret, utile au quotidien : son côté pratique sera comblé.' },
  col: { 1: 'Un objet à garder et à exposer, pour son goût des collections.', '-1': "Peu d'encombrement, beaucoup de plaisir : idéal pour son esprit minimaliste." },
  exp: { 1: "Un moment à vivre plutôt qu'un objet de plus.", '-1': 'Un objet qui reste, et qui rappellera votre attention.' },
  show: { 1: "Effet waouh garanti au moment de l'ouvrir.", '-1': 'Élégant et sans ostentation, à son image.' },
  nov: { 1: 'De quoi nourrir sa curiosité avec quelque chose de neuf.', '-1': 'Fidèle à ses habitudes : aucun risque de fausse note.' },
};

const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

export function joinFr(items) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`;
}

/** Retrouve le mot tel que l'utilisateur l'a écrit, à partir de sa racine. */
export function originalWord(text, stemmed) {
  for (const raw of String(text || '').split(/[\s,;.!?·/()«»"]+/)) {
    if (raw && stem(normalize(raw)) === stemmed) return raw;
  }
  return stemmed;
}

export function explain(candidate, profile) {
  const { idea, r } = candidate;
  const who = profile.name || 'Cette personne';
  const parts = [];

  if (r.interests.length) {
    const phrases = r.interests.slice(0, 2).map((id) => INTEREST_BY_ID[id]?.phrase).filter(Boolean);
    const details = r.tags.map(tagLabel).filter(Boolean).slice(0, 2).map(lowerFirst);
    parts.push(`${who} aime ${joinFr(phrases)}${details.length ? ` — surtout ${joinFr(details)}` : ''}.`);
  } else if (r.inferred.length && !(r.wish.length || r.fav.length || r.story.length)) {
    const labels = r.textTags.map(tagLabel).filter(Boolean).slice(0, 2);
    const phrase = INTEREST_BY_ID[r.inferred[0]]?.phrase;
    parts.push(labels.length
      ? `Ses références (${joinFr(labels)}) nous ont mis sur cette piste.`
      : `Ce que vous nous avez raconté laisse deviner un goût pour ${phrase}.`);
  } else if (r.adjacent) {
    const from = INTEREST_BY_ID[r.adjacent.from]?.phrase;
    const to = INTEREST_BY_ID[r.adjacent.to]?.phrase;
    parts.push(`Un pas de côté depuis ${from}, vers ${to} : de quoi surprendre sans tomber à côté.`);
  }

  if (r.wish.length) {
    const word = originalWord(profile.source.wish, r.wish[0]);
    parts.push(`Vous avez mentionné « ${word} » : ce cadeau y fait directement écho.`);
  } else if (r.fav.length) {
    const word = originalWord(profile.source.fav, r.fav[0]);
    parts.push(`Un clin d'œil à ses références (« ${word} »).`);
  } else if (r.story.length) {
    const word = originalWord(profile.source.story, r.story[0]);
    parts.push(`Votre description (« ${word} ») nous a mis sur cette piste.`);
  } else if (!r.interests.length && !r.inferred.length && r.textTags.length) {
    parts.push('Ce que vous avez raconté nous a mis sur cette piste.');
  }

  if (profile.petName && r.pet) {
    parts.push(`Imaginez ${profile.petName} à l'honneur !`);
  }

  if (r.trait && parts.length < 2) parts.push(TRAIT_TEXT[r.trait.k][String(r.trait.dir)]);

  if (r.occasion && parts.length < 3) {
    const occ = OCCASIONS.find((o) => o.v === profile.occasion);
    if (occ) parts.push(`Tout indiqué pour ${occ.phrase}.`);
  }

  if (!parts.length) {
    parts.push(candidate.mode === 'safe' ? 'Une valeur sûre, qui plaît presque à coup sûr.' : 'Une idée qui colle à ce que vous nous avez décrit.');
  }

  if (r.budgetRoom && parts.length < 3) parts.push('Et à ce prix, il reste de la marge pour un joli mot ou un petit extra.');

  return [...parts.slice(0, 3), idea.w].join(' ');
}
