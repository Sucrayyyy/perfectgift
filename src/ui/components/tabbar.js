// Barre d'onglets inférieure (zone du pouce), masquée pendant le questionnaire et la recherche.
import { h, clear } from '../../core/dom.js';
import { icon } from '../../core/icons.js';
import { pop } from '../../core/motion.js';
import { favorites, subscribe } from '../../core/store.js';
import { onRoute } from '../../core/router.js';

const TABS = [
  { id: 'home', href: '#/', label: 'Accueil', icon: 'gift' },
  { id: 'favorites', href: '#/favorites', label: 'Favoris', icon: 'heart' },
  { id: 'history', href: '#/history', label: 'Historique', icon: 'history' },
];

export function mountTabbar(nav) {
  const items = {};
  let lastCount = favorites.all().length;
  const badge = h('span', { class: 'tabbar__dot' });

  clear(nav);
  for (const tab of TABS) {
    const a = h('a', { href: tab.href, class: 'tabbar__item' }, icon(tab.icon), tab.label);
    if (tab.id === 'favorites') a.append(badge);
    items[tab.id] = a;
    nav.append(a);
  }

  const renderBadge = () => {
    const n = favorites.all().length;
    badge.textContent = String(n);
    badge.style.display = n ? '' : 'none';
    if (n > lastCount) pop(badge, 1.35);
    lastCount = n;
  };
  renderBadge();
  subscribe((type) => type === 'favorites' && renderBadge());

  onRoute(({ tab }) => {
    const hidden = !tab;
    nav.classList.toggle('is-hidden', hidden);
    document.body.classList.toggle('no-tabbar', hidden);
    for (const [id, a] of Object.entries(items)) {
      a.classList.toggle('is-on', id === tab);
      if (id === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  });
}
