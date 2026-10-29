// Mini-utilitaires DOM : création d'éléments déclarative, sans framework.
// Le texte fourni par l'utilisateur passe toujours par des nœuds texte (jamais innerHTML).

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') {
        el.className = Array.isArray(value) ? value.filter(Boolean).join(' ') : value;
      } else if (key === 'style' && typeof value === 'object') {
        for (const [prop, v] of Object.entries(value)) {
          if (v == null) continue;
          if (prop.startsWith('--')) el.style.setProperty(prop, v);
          else el.style[prop] = v;
        }
      } else if (key === 'html') {
        el.innerHTML = value; // réservé aux SVG internes de l'app
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'ref' && typeof value === 'function') {
        value(el);
      } else if (value === true) {
        el.setAttribute(key, '');
      } else {
        el.setAttribute(key, String(value));
      }
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false || child === true) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Espaces insécables de la typographie française (évite un « ? » seul en début de ligne). */
export function frenchSpacing(text) {
  return String(text)
    .replace(/ ([?!:;»€])/g, '\u00a0$1')
    .replace(/« /g, '«\u00a0');
}

export function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: value % 1 ? 2 : 0 }).format(value) + '\u00a0€';
}

export function formatRange([min, max]) {
  if (min === max) return formatPrice(min);
  return `${new Intl.NumberFormat('fr-FR').format(min)}\u00a0–\u00a0${formatPrice(max)}`;
}

export function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
