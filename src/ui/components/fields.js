// Champs du questionnaire. Chaque champ lit/écrit via ctx.get / ctx.set et signale ses changements.
import { h, formatPrice, frenchSpacing } from '../../core/dom.js';
import { icon, iconSvg } from '../../core/icons.js';
import { animate, pop, shakeX, EASE } from '../../core/motion.js';
import { fieldOptions, budgetRange } from '../../domain/questionnaire.js';
import { interestsFor } from '../../domain/interests.js';
import { MODES } from '../../domain/options.js';
import { toast } from './overlay.js';

function label(field, ctx) {
  if (!field.label) return null;
  return h('div', { class: 'field__label' },
    h('span', null, frenchSpacing(typeof field.label === 'function' ? field.label(ctx.answers()) : field.label)),
    field.optional ? h('span', { class: 'opt' }, 'facultatif') : null,
  );
}

function wrap(field, ctx, ...children) {
  return h('div', { class: 'field', dataset: { key: field.key } }, label(field, ctx), ...children);
}

function toggleValue(field, current, value, ctx, btn) {
  if (!field.multi) return current === value && field.optional ? null : value;
  let next = Array.isArray(current) ? current.slice() : [];
  const option = fieldOptions(field, ctx.answers()).find((o) => o.v === value);
  if (next.includes(value)) {
    next = next.filter((v) => v !== value);
  } else {
    if (field.max && next.length >= field.max) {
      shakeX(btn);
      toast(`${field.max} choix maximum`);
      return current;
    }
    if (option?.exclusive) next = [value];
    else next = next.filter((v) => !fieldOptions(field, ctx.answers()).find((o) => o.v === v)?.exclusive).concat(value);
  }
  if (!next.length && field.key === 'formats') next = ['tout'];
  return next;
}

function chips(field, ctx) {
  const box = h('div', { class: 'chips', role: field.multi ? 'group' : 'radiogroup' });
  const paint = () => {
    const value = ctx.get(field.key);
    for (const btn of box.children) {
      const on = field.multi ? (value || []).includes(btn.dataset.v) : String(value) === btn.dataset.v;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', String(on));
    }
  };
  for (const o of fieldOptions(field, ctx.answers())) {
    const btn = h('button', { type: 'button', class: 'chip', dataset: { v: String(o.v) } },
      o.e ? h('span', { class: 'chip__emoji' }, o.e) : null,
      o.l,
      field.multi ? h('span', { class: 'chip__check', html: iconSvg('check') }) : null,
    );
    btn.addEventListener('click', () => {
      const next = toggleValue(field, ctx.get(field.key), o.v, ctx, btn);
      ctx.set(field.key, next);
      paint();
      pop(btn, 1.05);
      ctx.changed({ structural: true, autoAdvance: !field.multi && next != null });
    });
    box.append(btn);
  }
  paint();
  return wrap(field, ctx, box);
}

function tiles(field, ctx) {
  const grid = h('div', { class: 'tiles' });
  const paint = () => {
    for (const t of grid.children) t.classList.toggle('is-on', ctx.get(field.key) === t.dataset.v);
  };
  for (const o of fieldOptions(field, ctx.answers())) {
    const t = h('button', { type: 'button', class: 'tile tile--compact', dataset: { v: o.v } },
      h('span', { class: 'tile__emoji' }, o.e),
      h('span', null, o.l, o.sub ? h('small', null, o.sub) : null),
      h('span', { class: 'tile__check', html: iconSvg('check') }),
    );
    t.addEventListener('click', () => {
      ctx.set(field.key, o.v);
      paint();
      pop(t, 1.04);
      ctx.changed({ structural: true });
    });
    grid.append(t);
  }
  paint();
  return wrap(field, ctx, grid);
}

function scale(field, ctx) {
  const row = h('div', { class: 'scale' });
  const paint = () => {
    for (const b of row.children) b.classList.toggle('is-on', String(ctx.get(field.key)) === b.dataset.v);
  };
  for (const o of field.options) {
    const b = h('button', { type: 'button', class: 'scale__opt', dataset: { v: String(o.v) } }, h('span', { class: 'e' }, o.e), o.l);
    b.addEventListener('click', () => {
      ctx.set(field.key, o.v);
      paint();
      ctx.changed({});
    });
    row.append(b);
  }
  paint();
  return wrap(field, ctx, row);
}

function text(field, ctx, multiline = false) {
  const attrs = {
    class: multiline ? 'textarea' : 'input',
    placeholder: field.placeholder || '',
    maxlength: field.maxLength || (multiline ? 1200 : 140),
    autocomplete: field.autocomplete || 'off',
    autocapitalize: 'sentences',
    enterkeyhint: multiline ? 'enter' : 'done',
  };
  const input = h(multiline ? 'textarea' : 'input', multiline ? attrs : { ...attrs, type: 'text' });
  input.value = ctx.get(field.key) || '';
  const counter = multiline ? h('div', { class: 'subtle', style: { textAlign: 'right' } }) : null;
  const update = () => {
    ctx.set(field.key, input.value);
    if (counter) counter.textContent = `${input.value.length} / ${attrs.maxlength}`;
    ctx.changed({});
  };
  input.addEventListener('input', update);
  if (!multiline) input.addEventListener('keydown', (e) => e.key === 'Enter' && input.blur());
  if (counter) counter.textContent = `${input.value.length} / ${attrs.maxlength}`;
  return wrap(field, ctx, input, field.hint ? h('div', { class: 'field__hint' }, field.hint) : null, counter);
}

function toggle(field, ctx) {
  const btn = h('button', { type: 'button', class: 'switch', role: 'switch' },
    h('span', { class: 'switch__text' }, field.label, field.hint ? h('small', null, field.hint) : null),
    h('span', { class: 'switch__track' }, h('span', { class: 'switch__thumb' })),
  );
  const paint = () => {
    const on = !!ctx.get(field.key);
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-checked', String(on));
  };
  btn.addEventListener('click', () => {
    ctx.set(field.key, !ctx.get(field.key));
    paint();
    ctx.changed({ structural: true });
  });
  paint();
  return h('div', { class: 'field' }, btn);
}

function bipolar(field, ctx) {
  const list = h('div', { class: 'stack stack--lg' });
  for (const t of fieldOptions(field, ctx.answers())) {
    const thumb = h('span', { class: 'bipolar__thumb' });
    const opts = [
      { v: -1, el: h('button', { type: 'button', class: 'bipolar__opt' }, h('span', { class: 'e' }, t.left.e), t.left.l) },
      { v: 0, el: h('button', { type: 'button', class: 'bipolar__opt bipolar__opt--mid', 'aria-label': 'Un peu des deux' }, '·  ·') },
      { v: 1, el: h('button', { type: 'button', class: 'bipolar__opt' }, h('span', { class: 'e' }, t.right.e), t.right.l) },
    ];
    const track = h('div', { class: 'bipolar__track', role: 'radiogroup', 'aria-label': t.q }, thumb, ...opts.map((o) => o.el));
    const place = () => {
      const value = ctx.get('traits')?.[t.k] ?? 0;
      const active = opts.find((o) => o.v === value);
      opts.forEach((o) => {
        o.el.classList.toggle('is-on', o === active);
        o.el.setAttribute('aria-checked', String(o === active));
        o.el.setAttribute('role', 'radio');
      });
      const el = active.el;
      thumb.style.width = `${el.offsetWidth}px`;
      thumb.style.transform = `translateX(${el.offsetLeft - 4}px)`;
      thumb.style.opacity = value === 0 ? '.55' : '1';
    };
    for (const o of opts) {
      o.el.addEventListener('click', () => {
        ctx.set('traits', { ...ctx.get('traits'), [t.k]: o.v });
        place();
        ctx.changed({});
      });
    }
    list.append(h('div', { class: 'bipolar' }, h('div', { class: 'bipolar__q' }, t.q), track));
    requestAnimationFrame(place);
    addEventListener('resize', place, { passive: true });
  }
  return h('div', { class: 'field' }, list);
}

function interests(field, ctx) {
  const grid = h('div', { class: 'tiles' });
  const paint = () => {
    const sel = ctx.get('interests');
    for (const t of grid.children) t.classList.toggle('is-on', sel.includes(t.dataset.v));
  };
  for (const it of interestsFor(ctx.answers())) {
    const t = h('button', { type: 'button', class: 'tile', dataset: { v: it.id } },
      h('span', { class: 'tile__emoji' }, it.e),
      h('span', null, it.l),
      h('span', { class: 'tile__check', html: iconSvg('check') }),
    );
    t.addEventListener('click', () => {
      const sel = ctx.get('interests');
      ctx.set('interests', sel.includes(it.id) ? sel.filter((x) => x !== it.id) : [...sel, it.id]);
      paint();
      pop(t, 1.04);
      ctx.changed({});
    });
    grid.append(t);
  }
  paint();

  // Passions personnalisées
  const customList = h('div', { class: 'chips' });
  const renderCustom = () => {
    customList.replaceChildren(...ctx.get('customInterests').map((c) => h('button', {
      type: 'button', class: 'chip chip--sm is-on', 'aria-label': `Retirer ${c}`,
      onclick: () => {
        ctx.set('customInterests', ctx.get('customInterests').filter((x) => x !== c));
        renderCustom();
        ctx.changed({});
      },
    }, c, h('span', { class: 'chip__check', html: iconSvg('x') }))));
  };
  const input = h('input', { class: 'input', type: 'text', placeholder: 'ex. escalade de bloc, Formule 1, origami…', maxlength: 40, enterkeyhint: 'done' });
  const add = () => {
    const v = input.value.trim();
    if (!v) return shakeX(input);
    const list = ctx.get('customInterests');
    if (!list.some((x) => x.toLowerCase() === v.toLowerCase())) ctx.set('customInterests', [...list, v]);
    input.value = '';
    renderCustom();
    const last = customList.lastElementChild;
    if (last) animate(last, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: EASE.spring });
    ctx.changed({});
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  });
  renderCustom();
  return h('div', { class: 'field' }, grid,
    h('div', { class: 'field mt-24' },
      h('div', { class: 'field__label' }, 'Une autre passion ?', h('span', { class: 'opt' }, 'facultatif')),
      h('div', { class: 'adder' }, input, h('button', { type: 'button', class: 'btn btn--dark', onclick: add, 'aria-label': 'Ajouter la passion' }, icon('plus'), 'Ajouter')),
      customList,
    ),
  );
}

function budget(field, ctx) {
  const amount = h('span', { class: 'budget__amount' });
  const display = h('div', { class: 'budget__display' }, amount);
  const grid = h('div', { class: 'tiles tiles--3' });
  const error = h('div', { class: 'budget__error', role: 'alert' });
  const minIn = h('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 0, placeholder: '0' });
  const maxIn = h('input', { class: 'input', type: 'number', inputmode: 'numeric', min: 1, placeholder: '150' });
  const custom = h('div', { class: 'budget__custom' },
    h('label', null, 'Minimum (€)', minIn),
    h('label', null, 'Maximum (€)', maxIn),
  );
  const over = h('button', { type: 'button', class: 'switch mt-16', role: 'switch' },
    h('span', { class: 'switch__text' }, 'Montrer aussi quelques idées hors budget', h('small', null, 'Toujours présentées à part, clairement signalées')),
    h('span', { class: 'switch__track' }, h('span', { class: 'switch__thumb' })),
  );

  const b = () => ctx.get('budget');
  const paint = (animateAmount) => {
    const cur = b();
    for (const t of grid.children) t.classList.toggle('is-on', cur.preset === t.dataset.v);
    custom.style.display = cur.preset === 'custom' ? '' : 'none';
    over.classList.toggle('is-on', !!cur.allowOver);
    over.setAttribute('aria-checked', String(!!cur.allowOver));
    const range = budgetRange(ctx.answers());
    if (!cur.preset) amount.textContent = '— €';
    else if (!range) amount.textContent = '…';
    else if (cur.preset === '500+') amount.textContent = `${formatPrice(500)} +`;
    else amount.textContent = range[0] > 0 ? `${range[0]} – ${formatPrice(range[1])}` : `≤ ${formatPrice(range[1])}`;
    error.textContent = cur.preset === 'custom' && (minIn.value || maxIn.value) && !range ? 'Le minimum doit être inférieur au maximum.' : '';
    if (animateAmount) animate(amount, [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: EASE.spring });
  };

  for (const o of field.options) {
    const t = h('button', { type: 'button', class: 'tile', dataset: { v: o.v } },
      h('span', { class: 'tile__emoji' }, o.e),
      h('span', null, o.l),
    );
    t.addEventListener('click', () => {
      const next = { ...b(), preset: o.v };
      if (o.v === 'custom' && next.max == null) {
        next.min = 30;
        next.max = 150;
        minIn.value = '30';
        maxIn.value = '150';
      }
      ctx.set('budget', next);
      pop(t, 1.04);
      paint(true);
      ctx.changed({});
      if (o.v === 'custom') setTimeout(() => maxIn.focus(), 150);
    });
    grid.append(t);
  }
  const onCustom = () => {
    ctx.set('budget', { ...b(), min: minIn.value === '' ? null : Number(minIn.value), max: maxIn.value === '' ? null : Number(maxIn.value) });
    paint(false);
    ctx.changed({});
  };
  minIn.addEventListener('input', onCustom);
  maxIn.addEventListener('input', onCustom);
  minIn.value = b().min ?? '';
  maxIn.value = b().max ?? '';
  over.addEventListener('click', () => {
    ctx.set('budget', { ...b(), allowOver: !b().allowOver });
    paint(false);
    ctx.changed({});
  });
  paint(false);
  return h('div', { class: 'field' }, display, grid, custom, error, over);
}

function modes(field, ctx) {
  const list = h('div', { class: 'mode-cards' });
  const paint = () => {
    for (const card of list.children) {
      const on = ctx.get('modes').includes(card.dataset.mode);
      card.classList.toggle('is-on', on);
      card.setAttribute('aria-pressed', String(on));
    }
  };
  for (const m of MODES) {
    const card = h('button', { type: 'button', class: 'mode-card', dataset: { mode: m.v } },
      h('span', { class: 'mode-card__icon', html: iconSvg(m.icon) }),
      h('span', null,
        h('span', { class: 'mode-card__name' }, m.name, m.recommended ? h('span', { class: 'pill pill--perfect' }, 'Recommandé') : null),
        h('span', { class: 'mode-card__title', style: { display: 'block' } }, m.title),
        h('p', null, m.desc),
      ),
      h('span', { class: 'mode-card__check', html: iconSvg('check') }),
    );
    card.addEventListener('click', () => {
      const cur = ctx.get('modes');
      if (cur.includes(m.v) && cur.length === 1) {
        shakeX(card);
        toast('Gardez au moins un mode');
        return;
      }
      ctx.set('modes', cur.includes(m.v) ? cur.filter((x) => x !== m.v) : [...cur, m.v]);
      paint();
      pop(card.querySelector('.mode-card__icon'), 1.15);
      ctx.changed({});
    });
    list.append(card);
  }
  paint();
  return h('div', { class: 'field' }, list,
    h('div', { class: 'mode-scale' }, h('span', null, 'Plus sûr'), h('span', { class: 'mode-scale__bar' }), h('span', null, 'Plus audacieux')),
  );
}

const RENDERERS = { chips, tiles, scale, text, textarea: (f, c) => text(f, c, true), toggle, bipolar, interests, budget, modes };

export function renderField(field, ctx) {
  return (RENDERERS[field.type] || text)(field, ctx);
}
