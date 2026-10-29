// Calendrier des occasions : anniversaires des proches et grandes fêtes françaises.
// Pur (aucun DOM) : testable, et réutilisable plus tard pour des rappels côté serveur.

const DAY = 86400000;

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntil(date, today = new Date()) {
  return Math.round((startOfDay(date) - startOfDay(today)) / DAY);
}

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Prochaine occurrence d'une date annuelle (un 29 février devient le 28 les années non bissextiles). */
export function nextAnnual(month, day, today = new Date()) {
  const t = startOfDay(today);
  const at = (y) => new Date(y, month - 1, month === 2 && day === 29 && !isLeap(y) ? 28 : day);
  const d = at(t.getFullYear());
  return d < t ? at(t.getFullYear() + 1) : d;
}

/** Dimanche de Pâques (algorithme grégorien anonyme). */
export function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Fête des Mères en France : dernier dimanche de mai, ou premier dimanche de juin si c'est la Pentecôte. */
export function mothersDay(year) {
  const lastMay = new Date(year, 4, 31);
  lastMay.setDate(31 - lastMay.getDay());
  const pentecost = easter(year);
  pentecost.setDate(pentecost.getDate() + 49);
  if (lastMay.getTime() === pentecost.getTime()) {
    const june1 = new Date(year, 5, 1);
    return new Date(year, 5, 1 + ((7 - june1.getDay()) % 7));
  }
  return lastMay;
}

/** Fête des Pères en France : troisième dimanche de juin. */
export function fathersDay(year) {
  const june1 = new Date(year, 5, 1);
  return new Date(year, 5, 1 + ((7 - june1.getDay()) % 7) + 14);
}

function nextOf(dateForYear, today) {
  const t = startOfDay(today);
  const d = dateForYear(t.getFullYear());
  return d < t ? dateForYear(t.getFullYear() + 1) : d;
}

/** « 1990-03-12 » ou « 03-12 » → { month: 3, day: 12 } */
export function parseBirthday(value) {
  const m = String(value || '').match(/(?:\d{4}-)?(\d{2})-(\d{2})$/);
  return m ? { month: Number(m[1]), day: Number(m[2]) } : null;
}

export function relativeDays(n) {
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  return `dans ${n} jours`;
}

/**
 * Occasions à venir, triées par date : anniversaires et Saint-Valentin des proches,
 * puis les fêtes communes (Noël, fêtes des Mères et des Pères, Saint-Valentin).
 */
export function upcomingEvents(people = [], today = new Date(), horizon = 60) {
  const events = [];
  let partnerValentine = false;
  for (const p of people) {
    const b = parseBirthday(p.birthday);
    if (b) {
      const date = nextAnnual(b.month, b.day, today);
      events.push({ id: `bday-${p.id}`, occasion: 'anniversaire', label: `Anniversaire de ${p.name}`, person: p, date });
    }
    if (p.answers?.relation === 'partenaire') {
      partnerValentine = true;
      events.push({ id: `valentin-${p.id}`, occasion: 'saint-valentin', label: `Saint-Valentin avec ${p.name}`, person: p, date: nextAnnual(2, 14, today) });
    }
  }
  events.push({ id: 'noel', occasion: 'noel', label: 'Noël', date: nextAnnual(12, 25, today) });
  events.push({ id: 'fete-meres', occasion: 'fete-meres', label: 'Fête des Mères', date: nextOf(mothersDay, today) });
  events.push({ id: 'fete-peres', occasion: 'fete-peres', label: 'Fête des Pères', date: nextOf(fathersDay, today) });
  if (!partnerValentine) events.push({ id: 'valentin', occasion: 'saint-valentin', label: 'Saint-Valentin', date: nextAnnual(2, 14, today) });

  return events
    .map((e) => ({ ...e, days: daysUntil(e.date, today) }))
    .filter((e) => e.days >= 0 && e.days <= horizon)
    .sort((a, b) => a.days - b.days || (a.person ? -1 : 1));
}

// ---------- Rappels pour le calendrier du téléphone (.ics) ----------

const pad = (n) => String(n).padStart(2, '0');
const icsDate = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const icsText = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Événement annuel avec une alerte quelques jours avant, à importer dans Calendrier / Google Agenda. */
export function buildIcs({ uid, title, description = '', url = '', month, day, alertDays = 7, today = new Date() }) {
  const start = nextAnnual(month, day, today);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PerfectGift//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@perfectgift`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    'RRULE:FREQ=YEARLY',
    `SUMMARY:${icsText(title)}`,
    description ? `DESCRIPTION:${icsText(description)}` : null,
    url ? `URL:${url}` : null,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(`${title} dans ${alertDays} jours : trouvez le cadeau`)}`,
    `TRIGGER:-P${alertDays}D`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}
