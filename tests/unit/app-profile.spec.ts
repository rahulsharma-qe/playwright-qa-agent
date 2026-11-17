import { expect, test } from '../../fixtures';
import { appEnvironment } from '../../support/apps/index.ts';
import { toolshop } from '../../support/apps/toolshop.ts';
import { appUrl } from '../../support/app-url';

// No browser and no Toolshop needed.
test.describe('application profile', () => {
  test('an unknown environment stops with a message naming it and the valid ones', () => {
    expect(() => appEnvironment(toolshop, 'staging')).toThrow(
      'Unknown environment TEST_ENV=staging for toolshop; valid: local, public-site, with-bugs.',
    );
  });

  // The with-bugs run is started by hand, so CI would not see these two differences break.
  test('the with-bugs environment keeps the token in sessionStorage and opens pages after /#', () => {
    const withBugs = appEnvironment(toolshop, 'with-bugs');
    expect(withBugs.tokenStore).toEqual({ storage: 'sessionStorage', key: 'auth-token' });
    expect(appUrl('/auth/login', withBugs)).toBe('/#/auth/login');
  });
});
