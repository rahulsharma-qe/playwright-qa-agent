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

export function cannotRegister(reason: string): string {
  return `Could not register a test customer on Toolshop (${reason}); ${ENVIRONMENT_PHRASE}.`;
}

/** A bot-check page (for example Cloudflare's "Performing security verification") instead of Toolshop. */
export const BOT_CHECK_MESSAGE =
  "Toolshop's public site is blocking this machine with a bot check. " +
  `${ENVIRONMENT_PHRASE.charAt(0).toUpperCase()}${ENVIRONMENT_PHRASE.slice(1)}; we do not try to get past it. ` +
  'In CI, the run uses its own copy of Toolshop.';
