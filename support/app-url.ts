import { settings } from './settings';

/**
 * How each Toolshop version puts a page in its address, from its router config in Toolshop's source at the pinned
 * commit. Sprint 5 uses plain paths (`useHash: false`): /auth/login. The "with bugs" version uses hash routing
 * (`useHash: true`): /#/auth/login. A difference between the copies, not a planted bug.
 */
export const ROUTE_PREFIX: Record<string, string> = {
  sprint5: '',
  'sprint5-with-bugs': '/#',
};

/** The address to open a page at, for the Toolshop version under test. Page objects open pages only through this. */
export function appUrl(path: string, sprint = settings.sprint): string {
  const prefix = ROUTE_PREFIX[sprint];
  if (prefix === undefined) throw new Error(`No route prefix for SPRINT=${sprint}; add it to ROUTE_PREFIX in support/app-url.ts.`);
  return `${prefix}${path}`;
}
