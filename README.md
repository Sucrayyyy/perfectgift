# PerfectGift

> Le cadeau parfait existe. Trouvons-le ensemble.

Application mobile (PWA) qui trouve le cadeau idéal à partir d'un questionnaire intelligent : passions détaillées, personnalité, envies, budget et niveau d'audace (SAFE · PERFECT · EXTRA). Chaque idée est accompagnée d'une explication personnalisée.

**Ouvrir l'app :** https://sucrayyyy.github.io/perfectgift/

## Installer sur iPhone

1. Ouvrir le lien ci-dessus dans **Safari**.
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. L'app s'ouvre en plein écran, avec son icône et son écran de lancement, et fonctionne hors connexion après la première visite.

## Ce qui fonctionne aujourd'hui

| Fonctionnalité | État |
|---|---|
| Accueil : une étiquette cadeau à remplir, les occasions qui approchent, vos proches | ✅ |
| Questionnaire dynamique (questions conditionnelles, 19 passions approfondies, passions libres) | ✅ |
| Budget (tranches ou sur mesure, option hors budget) et **cadeau à plusieurs** (part de chacun) | ✅ |
| Modes SAFE / PERFECT / EXTRA, combinables (liste rangée du plus sûr au plus audacieux) | ✅ |
| Moteur de recommandation (filtres, notation, diversité, gammes de prix, explications) | ✅ local |
| Résultats : 9 sections, tri, 7 filtres, relance sans refaire le questionnaire, « ne convient pas » | ✅ |
| **Proches** : goûts mémorisés, date d'anniversaire, recherche express (on va droit au budget) | ✅ sur l'appareil |
| **Calendrier** : anniversaires, Noël, fêtes des Mères et des Pères (dates françaises calculées) | ✅ |
| **Rappels** : export .ics avec alerte 7 jours avant, pour Calendrier / Google Agenda | ✅ (non testé sur iPhone réel) |
| **Cadeaux offerts** : marqués depuis les favoris, plus jamais reproposés à la même personne | ✅ |
| **Partage** d'une idée, d'une sélection ou de sa liste (feuille de partage iOS) | ✅ |
| Favoris + comparaison, historique, retour utilisateur | ✅ sur l'appareil |
| Prix vérifiés, liens exacts, images, disponibilité | ⏳ nécessite le serveur + une source marchande |
| Analyse IA du texte libre | ⏳ nécessite le serveur + une clé Claude |
| Notifications push, synchronisation entre appareils | ⏳ nécessite un serveur |

### Mode démo (par défaut)

Sans serveur configuré, l'app fonctionne en **mode démo explicite** :

- les idées viennent de `src/data/catalog.demo.js` (≈ 290 idées de produits et d'expériences qui existent dans le commerce) ;
- les prix sont des **fourchettes indicatives**, marquées « Prix indicatif » ;
- les boutons ouvrent une **recherche** chez le marchand (Fnac, Cultura, Amazon, Decathlon, Boulanger, Nike, LEGO, Etsy, Micromania, Google Shopping…), jamais une fausse fiche produit ;
- les visuels sont marqués « Visuel illustratif » ;
- aucune donnée ne quitte le téléphone.

## Architecture

Pas de framework ni d'étape de build : des modules JavaScript natifs, servis tels quels par GitHub Pages. L'app reste légère, rapide sur mobile et facile à faire évoluer (un passage à Capacitor permettra une publication sur les stores).

```
index.html, manifest.webmanifest, sw.js   PWA (écran d'accueil, hors ligne, écrans de lancement iPhone)
styles/        tokens (DA, thèmes), base, composants, écrans, motion
src/core/      DOM, routeur (View Transitions), stockage local, primitives d'animation, icônes
src/domain/    logique métier pure, sans DOM : questionnaire, profil, lexique, moteur, explications
src/data/      catalogue de démonstration, registre des marchands
src/services/  configuration publique, accès aux recommandations (démo ou connecté)
src/ui/        composants (cartes, feuilles, champs) et écrans
server/        API optionnelle (Cloudflare Worker) : clés secrètes, sources marchandes, IA
tests/         tests de la logique métier
```

**Moteur** (`src/domain/engine.js`) : filtres stricts (âge, catégories à éviter, liens, objets déjà possédés), puis une note combinant passions et sous-catégories, envies citées, texte libre, intention, format, personnalité, occasion, proximité, budget et mode d'audace. La sélection finale dédoublonne les variantes, diversifie les passions et couvre plusieurs gammes de prix. Il est déterministe, donc rejouable depuis l'historique.

## Brancher de vraies données

1. Déployer le serveur :
   ```bash
   cd server
   cp wrangler.toml.example wrangler.toml   # renseigner ALLOWED_ORIGINS
   npm install
   npx wrangler secret put SERPAPI_KEY      # offres Google Shopping
   npx wrangler secret put ANTHROPIC_API_KEY  # facultatif : analyse du texte libre
   npx wrangler deploy
   ```
2. Renseigner l'URL du Worker dans `src/services/config.js` (`apiBase`), puis republier.

Les idées du moteur deviennent alors des pistes que le serveur transforme en offres réelles (prix, lien exact, image, date de vérification). Une offre incomplète est ignorée ; sans réponse du serveur, l'app revient au mode démo et l'indique.

**Ajouter une plateforme :** une entrée dans `src/data/merchants.js` (liens de recherche) et un adaptateur dans `server/src/providers/` (offres vérifiées). Des emplacements sont prévus pour Amazon PA-API, les flux Awin (Fnac, Cultura, Boulanger…) et les plateformes d'expériences.

**Affiliation :** `server/src/affiliate.js` réécrit les liens uniquement si un identifiant partenaire est configuré, et l'app affiche alors la mention « lien partenaire ».

> Le serveur n'a pas pu être testé ici faute de clés : vérifiez les champs de réponse SerpApi avec votre compte avant la mise en production. L'analyse IA utilise `claude-opus-5-5` (effort bas, sortie JSON contrainte au vocabulaire du moteur) avec repli automatique `fallbacks: "default"` si une requête est déclinée.

## Développer

```bash
python3 scripts/serve.py        # http://localhost:8765 (sans cache)
```

Tests : ouvrir `http://localhost:8765/tests/` ou, sur macOS sans Node :

```bash
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m tests/run.js
```

Icônes et écrans de lancement : `swift scripts/render-icons.swift <svg> <png> <largeur[xhauteur]> …`

À chaque déploiement, incrémenter `VERSION` dans `sw.js`.

## Direction artistique

« Papier & Ruban », en aplats : papier crème, encre prune, ruban vermillon, nœud doré, étiquette en papier kraft. Le symbole est un cadeau noué d'un vrai nœud de ruban. Volontairement aucun code visuel « IA » (étoiles scintillantes, halos, dégradés lumineux) : l'app doit ressembler à un objet fait main, pas à un générateur.

Tout le visuel est dessiné pour l'app, sans emoji : un jeu d'icônes au trait (passions, occasions, types de cadeaux, objets) et des illustrations de cartes en forme de paquet rayé, l'objet de l'idée au centre du nœud.

Typographies : **Bricolage Grotesque** pour les titres, **Figtree** pour le texte. Motion : l'étiquette arrive en se balançant, les cartes se déballent, et pendant la recherche on emballe le cadeau (couvercle, ruban, nœud). Tout respecte le réglage iOS « Réduire les animations ».
