// Mini-framework de test sans dépendance : tourne dans le navigateur (tests/index.html)
// et en ligne de commande avec JavaScriptCore (`jsc -m tests/run.js`) ou Node (`node tests/run.js`).

const results = [];
let suite = '';

export function describe(name, fn) {
  suite = name;
  fn();
  suite = '';
}

export function it(name, fn) {
  const label = suite ? `${suite} › ${name}` : name;
  try {
    fn();
    results.push({ label, ok: true });
  } catch (err) {
    results.push({ label, ok: false, error: err && err.message ? err.message : String(err) });
  }
}

const show = (v) => {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

export function expect(actual) {
  const fail = (msg) => {
    throw new Error(msg);
  };
  return {
    toBe: (expected) => actual === expected || fail(`attendu ${show(expected)}, obtenu ${show(actual)}`),
    toEqual: (expected) => show(actual) === show(expected) || fail(`attendu ${show(expected)}, obtenu ${show(actual)}`),
    toBeTruthy: () => !!actual || fail(`attendu une valeur vraie, obtenu ${show(actual)}`),
    toBeFalsy: () => !actual || fail(`attendu une valeur fausse, obtenu ${show(actual)}`),
    toBeGreaterThan: (n) => actual > n || fail(`attendu > ${n}, obtenu ${show(actual)}`),
    toBeLessThan: (n) => actual < n || fail(`attendu < ${n}, obtenu ${show(actual)}`),
    toBeAtMost: (n) => actual <= n || fail(`attendu ≤ ${n}, obtenu ${show(actual)}`),
    toBeAtLeast: (n) => actual >= n || fail(`attendu ≥ ${n}, obtenu ${show(actual)}`),
    toContain: (x) => (actual && actual.includes && actual.includes(x)) || fail(`${show(actual)} ne contient pas ${show(x)}`),
    notToContain: (x) => !(actual && actual.includes && actual.includes(x)) || fail(`${show(actual)} contient ${show(x)}`),
  };
}

export function getResults() {
  return results.slice();
}
