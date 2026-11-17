import type { AppEnvironment } from './apps/app-profile.ts';
import { settings } from './settings';

/**
 * The address to open a page at, for the copy under test (its page-address prefix, from support/apps/).
 * Page objects open pages only through this.
 */
export function appUrl(path: string, environment: AppEnvironment = settings.environment): string {
  return `${environment.pagePrefix}${path}`;
}
