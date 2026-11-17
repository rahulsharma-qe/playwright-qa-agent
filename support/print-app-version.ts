// Prints the version name of the environment TEST_ENV picks (for Toolshop, its SPRINT), for the start and stop
// scripts, so nobody types SPRINT:   TEST_ENV=with-bugs node support/print-app-version.ts   → sprint5-with-bugs
import { selectRun } from './apps/index.ts';

try {
  console.log(selectRun(process.env).environment.version);
} catch (error) {
  console.error((error as Error).message);
  process.exit(1);
}
