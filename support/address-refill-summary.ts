// Prints how often the billing address form was filled again (observed note 15) and, inside GitHub Actions,
// adds the line to the run page.
//   node support/address-refill-summary.ts <results.json>
import { appendFileSync, readFileSync } from 'node:fs';
import { refillSummaryLine } from './address-refill.ts';
import { collectTests, totalRefills } from './planted-bug-count.ts';

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node support/address-refill-summary.ts <results.json>');
  process.exit(1);
}
const line = refillSummaryLine(totalRefills(collectTests(JSON.parse(readFileSync(resultsFile, 'utf8')))));
console.log(line);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
