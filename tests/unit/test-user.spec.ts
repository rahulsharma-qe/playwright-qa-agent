import { expect, test } from '../../fixtures';
import type { AppProfile } from '../../support/apps/app-profile.ts';
import { toolshop } from '../../support/apps/toolshop.ts';
import { isEnvironmentMessage } from '../../support/environment-messages';
import { canRegister, givenUserFrom } from '../../support/test-user';

// No browser and no application needed. Made-up values only.
test.describe('the given test user', () => {
  test('is read from APP_USER_EMAIL and APP_USER_PASSWORD', () => {
    expect(givenUserFrom({ APP_USER_EMAIL: 'qa@example.com', APP_USER_PASSWORD: 'Not-a-real-1' })).toEqual({
      email: 'qa@example.com',
      password: 'Not-a-real-1',
    });
  });

  test('missing settings stop with an environment message naming them', () => {
    expect(() => givenUserFrom({ APP_USER_EMAIL: 'qa@example.com' })).toThrow('APP_USER_EMAIL and APP_USER_PASSWORD are needed');
    try {
      givenUserFrom({});
    } catch (error) {
      expect(isEnvironmentMessage((error as Error).message)).toBe(true);
    }
  });

  test('Toolshop registers; an application with a given user and no registration cannot', () => {
    const noSignUp: AppProfile = { ...toolshop, testUser: { mode: 'given', canRegister: false } };
    expect([canRegister(toolshop), canRegister(noSignUp)]).toEqual([true, false]);
  });
});
