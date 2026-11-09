import { expect, test } from '../../fixtures';
import { appUrl } from '../../support/app-url';

// No browser and no Toolshop needed.
const PATHS = ['/auth/login', '/checkout', '/'];

test.describe('page addresses', () => {
  test('Sprint 5 opens every path unchanged', () => {
    for (const path of PATHS) expect(appUrl(path, 'sprint5')).toBe(path);
  });

  test('the with-bugs version opens the same paths after /#', () => {
    expect(PATHS.map((path) => appUrl(path, 'sprint5-with-bugs'))).toEqual(['/#/auth/login', '/#/checkout', '/#/']);
  });

  test('an unknown version stops with a message saying where to add it', () => {
    expect(() => appUrl('/auth/login', 'sprint9')).toThrow('No route prefix for SPRINT=sprint9');
  });
});
