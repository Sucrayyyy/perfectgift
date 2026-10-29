// Partage natif (feuille de partage iOS) avec repli sur le presse-papiers, et export de rappels .ics.
import { toast } from './overlay.js';

export const APP_URL = 'https://sucrayyyy.github.io/perfectgift/';

export async function shareContent({ title, text, url = APP_URL }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n'));
    toast('Copié : il ne reste qu’à coller');
    return 'copied';
  } catch {
    toast('Partage indisponible sur cet appareil');
    return 'failed';
  }
}

/** Télécharge un fichier .ics : iOS propose alors de l'ajouter au Calendrier. */
export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
