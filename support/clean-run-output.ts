// Run before every test script (npm's pretest hooks): removes the last run's results and account files, so the
// report and the secret scan only ever see this run's.   node support/clean-run-output.ts
import { rmSync } from 'node:fs';
import { ALLURE_RESULTS_DIR, RUN_ACCOUNTS_DIR } from './run-output-paths.ts';

for (const dir of [ALLURE_RESULTS_DIR, RUN_ACCOUNTS_DIR]) rmSync(dir, { recursive: true, force: true });
