// Tests des fonctionnalités principales (logique métier, sans interface).
import { describe, it, expect } from './harness.js';
import { emptyAnswers } from '../src/domain/options.js';
import { visibleSteps, normalizeAnswers, fieldOptions, budgetRange, STEPS } from '../src/domain/questionnaire.js';
import { extractTags, keywords } from '../src/domain/lexicon.js';
import { buildProfile } from '../src/domain/profile.js';
import { recommend } from '../src/domain/engine.js';
import { DEMO_CATALOG } from '../src/data/catalog.demo.js';
import { searchLinks, MERCHANTS } from '../src/data/merchants.js';
import { easter, mothersDay, fathersDay, nextAnnual, upcomingEvents, buildIcs, parseBirthday } from '../src/domain/calendar.js';

const answers = (over = {}) => {
  const a = { ...emptyAnswers(), ageBand: '26-40', relation: 'ami', closeness: 3, occasion: 'anniversaire', budget: { preset: '50-100', allowOver: false }, ...over };
  return normalizeAnswers(a);
};
const run = (a, adj) => recommend(buildProfile(a), DEMO_CATALOG, adj);
const ids = (list) => list.map((c) => c.idea.id);

describe('Catalogue démo', () => {
  it('chaque idée est complète et cohérente', () => {
    const seen = new Set();
    for (const idea of DEMO_CATALOG) {
      expect(seen.has(idea.id)).toBeFalsy();
      seen.add(idea.id);
      expect(!!idea.t && !!idea.d && !!idea.w).toBeTruthy();
      expect(idea.p[0] <= idea.p[1]).toBeTruthy();
      expect(idea.o >= 1 && idea.o <= 5).toBeTruthy();
      expect(['objet', 'experience', 'atelier', 'abonnement']).toContain(idea.y);
      for (const m of idea.m) expect(Object.keys(MERCHANTS)).toContain(m);
    }
  });
});

describe('Questionnaire dynamique', () => {
  it("n'affiche une étape d'approfondissement que pour les passions choisies", () => {
    const steps = visibleSteps(answers({ interests: ['lecture', 'gaming'] })).map((s) => s.id);
    expect(steps).toContain('deep-lecture');
    expect(steps).toContain('deep-gaming');
    expect(steps).notToContain('deep-sport');
  });
  it('ne propose pas « Partenaire » ni « Collègue » pour un enfant', () => {
    const a = answers({ ageBand: '8-12' });
    const rel = fieldOptions(STEPS.find((s) => s.id === 'relation').fields[0], a).map((o) => o.v);
    expect(rel).notToContain('partenaire');
    expect(rel).notToContain('collegue');
  });
  it('réserve la Saint-Valentin aux partenaires', () => {
    const occ = (a) => fieldOptions(STEPS.find((s) => s.id === 'occasion').fields[0], a).map((o) => o.v);
    expect(occ(answers({ relation: 'ami' }))).notToContain('saint-valentin');
    expect(occ(answers({ relation: 'partenaire' }))).toContain('saint-valentin');
  });
  it('nettoie les réponses devenues incohérentes', () => {
    const a = normalizeAnswers({ ...answers({ relation: 'partenaire', occasion: 'saint-valentin', interests: ['luxe'] }), ageBand: '8-12' });
    expect(a.relation).toBe(null);
    expect(a.occasion).toBe(null);
    expect(a.interests).notToContain('luxe');
  });
  it('saute personnalité et approfondissements pour un bébé', () => {
    const steps = visibleSteps(answers({ ageBand: '0-2', interests: ['animaux'] })).map((s) => s.id);
    expect(steps).notToContain('personality');
    expect(steps).notToContain('deep-animaux');
  });
  it('valide un budget personnalisé min/max', () => {
    expect(budgetRange(answers({ budget: { preset: 'custom', min: 30, max: 80 } }))).toEqual([30, 80]);
    expect(budgetRange(answers({ budget: { preset: 'custom', min: 90, max: 40 } }))).toBe(null);
  });
});

describe('Compréhension du texte libre', () => {
  it('détecte des passions et univers dans une description', () => {
    const tags = [...extractTags('Elle adore Harry Potter, boit du café et fait du yoga.')];
    expect(tags).toContain('harrypotter');
    expect(tags).toContain('cafe');
    expect(tags).toContain('yoga');
  });
  it('ignore les mots vides et met au singulier', () => {
    expect(keywords('Les platines vinyles')).toEqual(['platine', 'vinyle']);
  });
});

describe('Moteur de recommandation', () => {
  it('ne dépasse jamais le budget maximum dans les recommandations principales', () => {
    const res = run(answers({ interests: ['tech', 'musique'], budget: { preset: '20-50' } }));
    expect(res.best.length).toBeGreaterThan(5);
    for (const c of res.best) expect(c.idea.p[0]).toBeAtMost(50);
  });
  it('propose des idées hors budget seulement si autorisé, à part', () => {
    const base = { interests: ['luxe', 'mode'], budget: { preset: '100-200' } };
    expect(run(answers(base)).sections.over.length).toBe(0);
    const res = run(answers({ ...base, budget: { preset: '100-200', allowOver: true } }));
    expect(res.sections.over.length).toBeGreaterThan(0);
    for (const c of res.sections.over) expect(c.idea.p[0]).toBeGreaterThan(200);
  });
  it('couvre plusieurs gammes de prix pour un budget de 100 €', () => {
    const res = run(answers({ interests: ['lecture', 'cuisine', 'voyage'], budget: { preset: '50-100' } }));
    const tiers = new Set(res.best.slice(0, 8).map((c) => c.tier));
    expect(tiers.size).toBeAtLeast(2);
    expect(res.best.some((c) => c.idea.p[0] < 40)).toBeTruthy();
  });
  it("exclut l'alcool pour un mineur et les catégories à éviter", () => {
    const minor = run(answers({ ageBand: '13-17', relation: 'fratrie', interests: ['cuisine'], deep: { cuisine_cats: ['vin', 'cocktails'] } }));
    expect(minor.ranked.some((c) => c.idea.tg.includes('alcool'))).toBeFalsy();
    const noBooks = run(answers({ interests: ['lecture'], avoid: ['livre'] }));
    expect(noBooks.ranked.some((c) => c.idea.tg.includes('livre'))).toBeFalsy();
  });
  it('ne propose pas un objet déjà possédé', () => {
    const res = run(answers({ interests: ['lecture'], owned: 'Elle a déjà une Kindle', budget: { preset: '100-200' } }));
    expect(ids(res.ranked)).notToContain('read-ereader');
  });
  it('fait remonter ce que la personne souhaite', () => {
    const res = run(answers({ interests: ['musique'], wishes: 'une platine vinyle', budget: { preset: '200-500' } }));
    expect(ids(res.best.slice(0, 3))).toContain('music-turntable');
  });
  it('SAFE privilégie les valeurs sûres, EXTRA les idées audacieuses', () => {
    const base = { interests: ['lecture', 'voyage', 'cuisine'], budget: { preset: '50-100' } };
    const avg = (list) => list.reduce((s, c) => s + c.idea.o, 0) / list.length;
    const safe = run(answers({ ...base, modes: ['safe'] })).best.slice(0, 8);
    const extra = run(answers({ ...base, modes: ['extra'] })).best.slice(0, 8);
    expect(avg(safe)).toBeLessThan(avg(extra));
  });
  it('plusieurs modes : liste ordonnée du plus sûr au plus audacieux', () => {
    const res = run(answers({ interests: ['sport', 'nature'], modes: ['safe', 'perfect', 'extra'] }));
    const order = { safe: 0, perfect: 1, extra: 2 };
    const seq = res.best.map((c) => order[c.mode]);
    expect(seq.every((v, i) => i === 0 || v >= seq[i - 1])).toBeTruthy();
  });
  it('pas de doublons ni de variantes dans la sélection', () => {
    const res = run(answers({ interests: ['gaming', 'cinema', 'collection'] }));
    const groups = res.best.map((c) => c.idea.g);
    expect(new Set(groups).size).toBe(groups.length);
  });
  it('« Autres idées » renouvelle entièrement la sélection', () => {
    const a = answers({ interests: ['photo', 'art', 'voyage'] });
    const first = run(a);
    const second = run(a, { excluded: ids(first.best) });
    for (const id of ids(second.best)) expect(ids(first.best)).notToContain(id);
  });
  it('« Évite les objets matériels » ne garde que expériences, ateliers et abonnements', () => {
    const res = run(answers({ interests: ['cuisine', 'art'] }), { noMaterial: true });
    expect(res.best.length).toBeGreaterThan(3);
    for (const c of res.best) expect(c.idea.y === 'objet').toBeFalsy();
  });
  it('« Budget inférieur » réduit le plafond', () => {
    const res = run(answers({ interests: ['tech'], budget: { preset: '100-200' } }), { budgetFactor: 0.6 });
    expect(res.budget[1]).toBe(120);
    for (const c of res.best) expect(c.idea.p[0]).toBeAtMost(120);
  });
  it('les explications sont personnalisées et la pertinence bornée', () => {
    const res = run(answers({ name: 'Léa', interests: ['lecture'], deep: { lecture_genres: ['fantasy'] } }));
    const top = res.best[0];
    expect(top.why).toContain('Léa');
    for (const c of res.best) {
      expect(c.relevance).toBeAtLeast(38);
      expect(c.relevance).toBeAtMost(98);
    }
  });
  it('est déterministe', () => {
    const a = answers({ interests: ['sport', 'tech'] });
    expect(ids(run(a).best)).toEqual(ids(run(a).best));
  });
  it('trouve des idées pour un bébé', () => {
    const res = run(answers({ ageBand: '0-2', relation: 'famille', occasion: 'naissance', interests: ['animaux'], budget: { preset: '20-50' } }));
    expect(res.best.length).toBeGreaterThan(3);
    for (const c of res.best) expect(c.idea.a[0]).toBeAtMost(1);
  });
  it('trouve des idées sans passion renseignée', () => {
    const res = run(answers({ interests: [], tones: ['utile'], relation: 'collegue', closeness: 1, occasion: 'retraite', budget: { preset: '20-50' } }));
    expect(res.best.length).toBeGreaterThan(5);
  });
});

describe('Liens marchands', () => {
  it('ouvre une recherche encodée, jamais une fausse fiche produit', () => {
    const idea = DEMO_CATALOG.find((i) => i.id === 'read-collector');
    const links = searchLinks(idea);
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.type).toBe('search');
      expect(l.url).toContain(encodeURIComponent(idea.q));
    }
  });
});

describe('Calendrier des occasions', () => {
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  it('calcule Pâques', () => {
    expect(ymd(easter(2026))).toBe('2026-04-05');
    expect(ymd(easter(2024))).toBe('2024-03-31');
  });
  it('calcule la fête des Mères française, y compris quand elle tombe à la Pentecôte', () => {
    expect(ymd(mothersDay(2026))).toBe('2026-05-31');
    expect(ymd(mothersDay(2024))).toBe('2024-05-26');
    expect(ymd(mothersDay(2004))).toBe('2004-06-06');
  });
  it('calcule la fête des Pères (3e dimanche de juin)', () => {
    expect(ymd(fathersDay(2026))).toBe('2026-06-21');
  });
  it('gère le 29 février et le passage d’année', () => {
    expect(ymd(nextAnnual(2, 29, new Date(2026, 9, 29)))).toBe('2027-02-28');
    expect(ymd(nextAnnual(3, 12, new Date(2026, 9, 29)))).toBe('2027-03-12');
    expect(parseBirthday('1992-11-10')).toEqual({ month: 11, day: 10 });
  });
  it('liste les occasions à venir, les proches en premier', () => {
    const today = new Date(2026, 9, 29);
    const events = upcomingEvents([{ id: 'p1', name: 'Léa', birthday: '1994-11-10' }], today, 60);
    expect(events[0].label).toBe('Anniversaire de Léa');
    expect(events[0].days).toBe(12);
    expect(events.map((e) => e.id)).toContain('noel');
  });
  it('produit un rappel annuel avec alerte', () => {
    const ics = buildIcs({ uid: 'p1', title: 'Anniversaire de Léa', month: 11, day: 10, today: new Date(2026, 9, 29) });
    expect(ics).toContain('RRULE:FREQ=YEARLY');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261110');
    expect(ics).toContain('TRIGGER:-P7D');
  });
});
