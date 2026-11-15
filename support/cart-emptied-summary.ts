// Prints the times the order tests waited for the site to empty the cart (observed note 16): one line per order,
// then a summary line, which inside GitHub Actions is also added to the run page.
//   node support/cart-emptied-summary.ts <results.json>
import { appendFileSync, readFileSync } from 'node:fs';
import { CART_EMPTIED, CART_EMPTIED_BOUND_MS, cartEmptiedSummaryLine, parseCartEmptied, type CartEmptiedTimes } from './cart-emptied.ts';

type JsonSuite = {
  specs?: { title: string; tests?: { results?: { annotations?: { type: string; description?: string }[] }[] }[] }[];
  suites?: JsonSuite[];
};

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node support/cart-emptied-summary.ts <results.json>');
  process.exit(1);
}

const times: CartEmptiedTimes[] = [];
const walk = (suite: JsonSuite) => {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const result of test.results ?? []) {
        for (const annotation of result.annotations ?? []) {
          if (annotation.type !== CART_EMPTIED) continue;
          const parsed = parseCartEmptied(annotation.description ?? '');
          if (parsed) {
            times.push(parsed);
            console.log(`${spec.title}: span ${parsed.spanMs} ms, DELETE ${parsed.deleteMs} ms`);
          }
        }
      }
    }
  }
  (suite.suites ?? []).forEach(walk);
};
((JSON.parse(readFileSync(resultsFile, 'utf8')) as { suites?: JsonSuite[] }).suites ?? []).forEach(walk);

const line = cartEmptiedSummaryLine(times, CART_EMPTIED_BOUND_MS);
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
