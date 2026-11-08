// Keeps this run's test-account passwords out of the public report (GitHub Pages and the run artifact).
//   node support/secret-scan.mjs redact   before the report is built: replaces account emails and passwords in
//                                          the text files of allure-results/ with <test account email|password>.
//                                          The one expected place for a password is the CI log-mask line
//                                          (::add-mask::), which Allure keeps with a test's output. A password
//                                          anywhere else is a leak: in CI the job stops and nothing is uploaded.
//   node support/secret-scan.mjs check    after the report is built: reads every file in allure-results/ and
//                                          allure-report/ as raw bytes; exit 1 if a password is found.
// Limit: compressed files (trace archives, screenshots) cannot be read this way. They come only from the
// logged-in tests, where no password is typed or printed (see playwright.config.ts).
// The values come from playwright/.auth/run-accounts/ (one file per account, git-ignored, never attached to the
// report). Output names files only, never a value.
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const RUN_ACCOUNTS_DIR = 'playwright/.auth/run-accounts';
const TEXT_FILES = new Set(['.json', '.md', '.txt', '.log', '.html', '.xml', '.csv']);
const mode = process.argv[2];

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

function stop(message) {
  console.error(message);
  process.exit(1);
}

const accountFiles = filesUnder(RUN_ACCOUNTS_DIR).filter((f) => f.endsWith('.json'));
if (accountFiles.length === 0) {
  if (process.env.CI) stop('No run-accounts file; cannot scan; nothing uploaded.');
  console.log('No run-accounts file: this run registered no test account, so there is nothing to scan for.');
  process.exit(0);
}
const accounts = accountFiles.map((f) => JSON.parse(readFileSync(f, 'utf8')));

if (mode === 'redact') {
  let maskLines = 0;
  const leaks = new Set();
  let changedFiles = 0;
  for (const file of filesUnder('allure-results').filter((f) => TEXT_FILES.has(extname(f)))) {
    const original = readFileSync(file, 'utf8');
    let text = original;
    for (const { email, password } of accounts) {
      const maskLine = `::add-mask::${password}`;
      maskLines += text.split(maskLine).length - 1;
      text = text.split(maskLine).join('::add-mask::<test account password>');
      if (text.includes(password)) leaks.add(file);
      text = text.split(password).join('<test account password>').split(email).join('<test account email>');
    }
    if (text !== original) {
      writeFileSync(file, text);
      changedFiles++;
    }
  }
  console.log(`Secret scan: ${accounts.length} test accounts; ${maskLines} log-mask lines and ${leaks.size} other places replaced (${changedFiles} result files changed).`);
  if (leaks.size > 0) {
    const message = `A test-account password was found outside the log-mask lines:\n  ${[...leaks].join('\n  ')}`;
    if (process.env.CI) stop(`${message}\nNothing uploaded.`);
    console.error(`${message}\n(Replaced locally; in CI this stops the report.)`);
  }
} else if (mode === 'check') {
  const found = [];
  for (const file of [...filesUnder('allure-results'), ...filesUnder('allure-report')]) {
    const content = readFileSync(file).toString('latin1');
    if (accounts.some(({ password }) => content.includes(Buffer.from(password, 'utf8').toString('latin1')))) {
      found.push(file);
    }
  }
  if (found.length > 0) {
    stop(`A secret value was found in the report; nothing uploaded. Files:\n  ${found.join('\n  ')}`);
  }
  console.log(`Secret scan: ${accounts.length} test-account passwords checked; none in allure-results/ or allure-report/.`);
} else {
  stop('Usage: node support/secret-scan.mjs redact|check');
}
