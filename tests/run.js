// Lanceur en ligne de commande :
//   macOS : /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc -m tests/run.js
//   Node  : node tests/run.js
import './specs.js';
import { getResults } from './harness.js';

const log = typeof print === 'function' ? print : console.log;
const results = getResults();
const failed = results.filter((r) => !r.ok);
for (const r of results) log(`${r.ok ? '✓' : '✗'} ${r.label}${r.ok ? '' : `\n    → ${r.error}`}`);
log(`\n${results.length - failed.length}/${results.length} tests réussis`);
if (failed.length && typeof process !== 'undefined') process.exitCode = 1;
