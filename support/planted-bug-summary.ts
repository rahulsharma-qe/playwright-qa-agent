// Prints the planted-bug summary and, inside GitHub Actions, adds it to the run page.
//   node support/planted-bug-summary.ts <results.json>
import { appendFileSync, readFileSync } from 'node:fs';
import { collectTests, summaryLines } from './planted-bug-count.ts';

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node support/planted-bug-summary.ts <results.json>');
  process.exit(1);
}
const lines = summaryLines(collectTests(JSON.parse(readFileSync(resultsFile, 'utf8'))), process.env.GITHUB_SHA ?? 'local');
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## ${lines[0]}\n\n${lines.slice(1).join('\n')}\n`);
}
