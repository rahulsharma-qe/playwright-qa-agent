import { expect, test } from '../../fixtures';
import { MAX_EMAIL_LENGTH, testEmail } from '../../support/test-accounts';

// No browser and no Toolshop needed.
test.describe('test accounts', () => {
  test('test emails stay within the shortest email limit, even with a long CI run id', () => {
    for (const purpose of ['session', 'login']) {
      const email = testEmail(purpose, '99999999999');
      expect(email.length, email).toBeLessThanOrEqual(MAX_EMAIL_LENGTH);
      expect(email).toMatch(/^pqa-99999999999-[a-z]+-[a-z0-9]+@example\.com$/);
    }
  });
});
