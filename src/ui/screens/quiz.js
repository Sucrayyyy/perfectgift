// Questionnaire : une étape courte à la fois, transitions latérales, progression en ruban.
import { h, frenchSpacing } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, stagger, shakeX, RISE, EASE } from '../../core/motion.js';
import { draft } from '../../core/store.js';
import { navigate } from '../../core/router.js';
import { emptyAnswers } from '../../domain/options.js';
import { INTEREST_BY_ID } from '../../domain/interests.js';
import { visibleSteps, visibleFields, isStepValid, normalizeAnswers, resolve } from '../../domain/questionnaire.js';
import { renderField } from '../components/fields.js';
import { toast } from '../components/overlay.js';

export function QuizScreen() {
  const saved = draft.get();
  let answers = normalizeAnswers({ ...emptyAnswers(), ...(saved?.answers || {}) });
  let steps = visibleSteps(answers);
  let index = Math.max(0, steps.findIndex((s) => s.id === saved?.stepId));
  let fieldKeys = '';
  let busy = false;

  const persist = () => draft.set({ answers, stepId: steps[index]?.id, updatedAt: new Date().toISOString() });

  const fill = h('span', { class: 'progress__fill' });
  const star = h('span', { class: 'progress__star', html: iconSvg('star4') });
  star.style.color = 'var(--gold)';
  const count = h('div', { class: 'progress__count' });
  const backBtn = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Étape précédente', onclick: () => go(-1) }, icon('arrow-left'));
  const closeBtn = h('button', { type: 'button', class: 'btn btn--icon', 'aria-label': 'Quitter le questionnaire', onclick: () => { persist(); navigate('/', { dir: 'back' }); } }, icon('x'));
  const top = h('header', { class: 'quiz__top' }, backBtn, h('div', null, h('div', { class: 'progress' }, fill, star), count), closeBtn);

  const stage = h('div', { class: 'quiz__stage' });
  const skipBtn = h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => go(1, { skip: true }) }, 'Passer');
  const nextBtn = h('button', { type: 'button', class: 'btn btn--primary btn--lg' });
  nextBtn.addEventListener('click', () => go(1));
  const footer = h('footer', { class: 'quiz__footer' }, skipBtn, nextBtn);

  const el = h('section', { class: 'screen screen--bare quiz' }, top, stage, footer);

  const ctx = {
    answers: () => answers,
    get: (key) => (key in answers ? answers[key] : answers.deep[key]),
    set: (key, value) => {
      if (key in answers) answers = { ...answers, [key]: value };
      else answers = { ...answers, deep: { ...answers.deep, [key]: value } };
      if (key === 'relation') answers.closeness = null;
      answers = normalizeAnswers(answers);
    },
    changed: ({ structural } = {}) => {
      persist();
      updateFooter();
      if (structural) refreshFields();
    },
  };

  function updateFooter() {
    const step = steps[index];
    const valid = isStepValid(step, answers);
    const last = index === steps.length - 1;
    nextBtn.replaceChildren(...[last && icon('star4'), last ? 'Lancer la recherche' : 'Continuer', !last && icon('arrow-right')].filter(Boolean));
    nextBtn.classList.toggle('is-disabled', !valid);
    nextBtn.style.opacity = valid ? '' : '.45';
    skipBtn.style.display = step.optional || step.skipLabel ? '' : 'none';
    skipBtn.textContent = step.skipLabel || 'Passer';
    const pct = ((index + 1) / steps.length) * 100;
    fill.style.width = `${pct}%`;
    star.style.left = `${pct}%`;
    count.textContent = `${index + 1} / ${steps.length}`;
  }

  function fieldsFor(step) {
    return visibleFields(step, answers);
  }

  function head(step) {
    const interest = step.interest ? INTEREST_BY_ID[step.interest] : null;
    return h('div', { class: 'quiz__head' },
      interest
        ? h('div', { class: 'interest-head' },
          h('span', { class: 'interest-head__emoji', style: { background: interest.hue[1] } }, interest.e),
          h('span', { class: 'eyebrow' }, `${step.section} · ${interest.l}`))
        : h('span', { class: 'eyebrow quiz__eyebrow' }, h('span', { class: 'dot' }), step.section),
      h('h1', { class: 'display' }, frenchSpacing(resolve(step.title, answers))),
      step.sub ? h('p', { class: 'quiz__sub' }, frenchSpacing(resolve(step.sub, answers))) : null,
    );
  }

  function buildFields(step) {
    const list = fieldsFor(step);
    fieldKeys = list.map((f) => f.key).join('|') + '#' + JSON.stringify(list.map((f) => (typeof f.options === 'function' ? f.options(answers).map((o) => o.v) : 0)));
    return h('div', { class: 'quiz__fields' }, list.map((f) => renderField(f, ctx)));
  }

  /** Ré-affiche les champs si la structure a changé (champ conditionnel, options dépendantes). */
  function refreshFields() {
    const step = steps[index];
    const list = fieldsFor(step);
    const nextKeys = list.map((f) => f.key).join('|') + '#' + JSON.stringify(list.map((f) => (typeof f.options === 'function' ? f.options(answers).map((o) => o.v) : 0)));
    if (nextKeys === fieldKeys) return;
    const old = stage.querySelector('.quiz__fields');
    const before = new Set([...old.children].map((c) => c.dataset.key));
    const fresh = buildFields(step);
    old.replaceWith(fresh);
    for (const child of fresh.children) {
      if (!before.has(child.dataset.key)) animate(child, RISE, { duration: 420, easing: EASE.out });
    }
  }

  function renderStep(dir = 0) {
    const step = steps[index];
    const content = h('div', { class: 'quiz__step' }, head(step), buildFields(step));
    const old = stage.firstElementChild;
    const enter = () => {
      stage.replaceChildren(content);
      scrollTo({ top: 0 });
      updateFooter();
      const parts = [content.querySelector('.quiz__head'), ...content.querySelector('.quiz__fields').children];
      if (dir) animate(content, [{ transform: `translateX(${dir * 36}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 460, easing: EASE.out });
      stagger(parts, RISE, { step: 60, delay: dir ? 60 : 120, duration: 520 });
      busy = false;
    };
    if (old && dir) {
      animate(old, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 36}px)`, opacity: 0 }], { duration: 200, easing: EASE.inOut, keep: true }).then(enter);
    } else enter();
  }

  function go(delta, { skip = false } = {}) {
    if (busy) return;
    const step = steps[index];
    if (delta > 0 && !skip && !isStepValid(step, answers)) {
      shakeX(nextBtn);
      toast(step.id === 'budget' ? 'Choisissez un budget pour continuer' : 'Choisissez une option pour continuer');
      return;
    }
    if (delta < 0 && index === 0) {
      persist();
      navigate('/', { dir: 'back' });
      return;
    }
    steps = visibleSteps(answers);
    const currentIdx = steps.findIndex((s) => s.id === step.id);
    const nextIndex = (currentIdx < 0 ? index : currentIdx) + delta;
    if (nextIndex >= steps.length) {
      persist();
      draft.set({ answers, stepId: step.id, ready: true });
      navigate('/search');
      return;
    }
    busy = true;
    index = Math.max(0, nextIndex);
    persist();
    renderStep(delta > 0 ? 1 : -1);
  }

  return {
    el,
    tab: null,
    mount() {
      renderStep(0);
      animate(top, [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 420 });
      animate(footer, [{ opacity: 0, transform: 'translate(-50%, 30px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 520, delay: 120, easing: EASE.out });
    },
  };
}

/** Démarre un questionnaire neuf (éventuellement pré-rempli, ex. une occasion choisie sur l'accueil). */
export function startQuiz(prefill = {}, stepId = 'who') {
  draft.set({ answers: { ...emptyAnswers(), ...prefill }, stepId, updatedAt: new Date().toISOString() });
  navigate('/quiz');
}
