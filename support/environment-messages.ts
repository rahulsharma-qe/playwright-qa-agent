/**
 * The messages that say the environment, not a test, failed. They share one phrase, so the planted-bug summary
 * (and anyone reading a report) can tell an environment problem from a test failure.
 * Plain TypeScript with no imports, so Node can also run it directly (the summary script does).
 */
const ENVIRONMENT_PHRASE = 'this is an environment problem, not a test failure';

export function isEnvironmentMessage(text: string): boolean {
  return text.toLowerCase().includes(ENVIRONMENT_PHRASE);
}

export function siteNotResponding(what: 'site' | 'API', url: string): string {
  return `Toolshop ${what} is not responding at ${url}; ${ENVIRONMENT_PHRASE}.`;
}

/** True for an address on this machine, where the pinned local copy runs. */
export function isLocalAddress(url: string): boolean {
  return ['localhost', '127.0.0.1'].includes(new URL(url).hostname);
}

/** The local copy did not answer: almost always it was not started. */
export function localCopyNotRunning(): string {
  return (
    'The local Toolshop copy is not running. Start it with ci/start-toolshop.sh. ' +
    `${ENVIRONMENT_PHRASE.charAt(0).toUpperCase()}${ENVIRONMENT_PHRASE.slice(1)}.`
  );
}

/** The message for an address that gave no answer at all: the local copy's own, or "not responding at <URL>". */
export function noAnswerFrom(what: 'site' | 'API', url: string): string {
  return isLocalAddress(url) ? localCopyNotRunning() : siteNotResponding(what, url);
}

export function cannotLogInThroughApi(reason: string): string {
  return `Could not log the test customer in through Toolshop's API (${reason}); ${ENVIRONMENT_PHRASE}.`;
}

export function cannotRegister(reason: string): string {
  return `Could not register a test customer on Toolshop (${reason}); ${ENVIRONMENT_PHRASE}.`;
}

/** A logged-in test met "Sign in" after its login (the run's, or the test's own customer's) had expired. */
export function loginExpired(minutesSinceLogin: number, lifetimeMinutes: number, source: string, whose = 'the run'): string {
  const owner = whose === 'the run' ? "The run's" : "This test's own customer's";
  return (
    `${owner} login expired before this test ended (${minutesSinceLogin} min after login; it lasts ${lifetimeMinutes} min, ` +
    `from ${source}); ${ENVIRONMENT_PHRASE}. Shorten the run or log in again per part.`
  );
}

/** A bot-check page (for example Cloudflare's "Performing security verification") instead of Toolshop. */
export const BOT_CHECK_MESSAGE =
  "Toolshop's public site is blocking this machine with a bot check. " +
  `${ENVIRONMENT_PHRASE.charAt(0).toUpperCase()}${ENVIRONMENT_PHRASE.slice(1)}; we do not try to get past it. ` +
  'In CI, the run uses its own copy of Toolshop.';
