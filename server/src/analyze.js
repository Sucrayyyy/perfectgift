// Compréhension sémantique du texte libre avec Claude.
// Le modèle ne choisit que parmi le vocabulaire de tags que le moteur connaît : il ne peut ni inventer
// de produit ni de prix. Il sert uniquement à mieux comprendre la personne.
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `Tu aides une application de recommandation de cadeaux.
On te donne la description libre d'une personne (en français) et une liste de tags autorisés.
Retourne uniquement les tags qui décrivent clairement ses goûts, passions ou envies d'après le texte.
N'ajoute aucun tag absent de la liste. Si rien ne correspond, retourne une liste vide.`;

export async function analyzeText(text, vocabulary, env) {
  if (!text.trim() || !vocabulary.length) return [];
  const allowed = [...new Set(vocabulary.map(String))].slice(0, 400);
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 1024,
      // Repli automatique sur un autre modèle si la requête est déclinée par les filtres de sécurité
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: { tags: { type: 'array', items: { type: 'string', enum: allowed } } },
            required: ['tags'],
            additionalProperties: false,
          },
        },
      },
      messages: [{ role: 'user', content: `Tags autorisés : ${allowed.join(', ')}\n\nDescription :\n${text}` }],
    });

    if (response.stop_reason !== 'end_turn') return [];
    const block = response.content.find((b) => b.type === 'text');
    const parsed = block ? JSON.parse(block.text) : { tags: [] };
    return (parsed.tags || []).filter((t) => allowed.includes(t));
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) console.warn('Analyse IA : quota atteint');
    else if (err instanceof Anthropic.APIError) console.warn(`Analyse IA : erreur ${err.status}`);
    else console.warn('Analyse IA indisponible', err);
    return [];
  }
}
