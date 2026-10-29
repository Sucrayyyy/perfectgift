// Point d'entrée : thème, barre d'onglets, routes, service worker (mode hors ligne / écran d'accueil).
import { route, start, onRoute } from './core/router.js';
import { applyTheme, theme } from './core/store.js';
import { mountTabbar } from './ui/components/tabbar.js';
import { closeAllSheets } from './ui/components/overlay.js';
import { HomeScreen } from './ui/screens/home.js';
import { QuizScreen } from './ui/screens/quiz.js';
import { SearchingScreen } from './ui/screens/searching.js';
import { ResultsScreen } from './ui/screens/results.js';
import { FavoritesScreen } from './ui/screens/favorites.js';
import { HistoryScreen } from './ui/screens/historyScreen.js';
import { PeopleScreen } from './ui/screens/people.js';

applyTheme(theme.get());
mountTabbar(document.getElementById('tabbar'));
onRoute(closeAllSheets);

route('/', () => HomeScreen());
route('/quiz', () => QuizScreen());
route('/search', () => SearchingScreen());
route('/results/:id', (params) => ResultsScreen(params));
route('/favorites', () => FavoritesScreen());
route('/history', () => HistoryScreen());
route('/people', () => PeopleScreen());

start();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Évite le double-tap zoom sur les contrôles (iOS) sans bloquer le zoom d'accessibilité.
document.addEventListener('dblclick', (e) => {
  if (e.target.closest('button, a')) e.preventDefault();
}, { passive: false });

