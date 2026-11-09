/**
 * Recognises a bot-check page (for example Cloudflare's "Performing security verification") instead of Toolshop.
 * Public sites often show one to browsers on data-centre machines such as CI runners. We never try to get past it;
 * we say clearly that the environment, not a test, is the problem.
 */
export const BOT_CHECK_MESSAGE =
  "Toolshop's public site is blocking this machine with a bot check. This is an environment problem, not a test " +
  'failure; we do not try to get past it. In CI, the run uses its own copy of Toolshop.';

const CHALLENGE_TEXTS = ['Performing security verification', 'Just a moment'];

export type ResponseSummary = {
  status: number;
  headers: Record<string, string>; // header names in lower case, as Playwright gives them
  body?: string; // read only when the status says it could be a challenge
};

/** Whether the body is worth reading: challenges come back as 403 or 503. */
export function mightBeBotCheck(status: number): boolean {
  return status === 403 || status === 503;
}

export function isBotCheck({ status, headers, body = '' }: ResponseSummary): boolean {
  if (headers['cf-mitigated'] === 'challenge') return true;
  return mightBeBotCheck(status) && CHALLENGE_TEXTS.some((text) => body.includes(text));
}
