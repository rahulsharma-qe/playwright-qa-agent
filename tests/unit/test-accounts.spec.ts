import { expect, test } from '../../fixtures';
import { MAX_EMAIL_LENGTH, signUpFieldsFor, testEmail } from '../../support/test-accounts';

// No browser and no Toolshop needed.
test.describe('test accounts', () => {
  test('Sprint 5 signs up with name, email and password only', () => {
    expect(signUpFieldsFor('sprint5')).toEqual({});
  });

  test('the with-bugs version also gets address, city and country', () => {
    expect(Object.keys(signUpFieldsFor('sprint5-with-bugs'))).toEqual(expect.arrayContaining(['address', 'city', 'country']));
  });

  test('an unknown version stops with a message saying where to add it', () => {
    expect(() => signUpFieldsFor('sprint9')).toThrow('No sign-up fields for SPRINT=sprint9');
  });

  test('test emails stay within the shortest email limit, even with a long CI run id', () => {
    for (const purpose of ['session', 'login']) {
      const email = testEmail(purpose, '99999999999');
      expect(email.length, email).toBeLessThanOrEqual(MAX_EMAIL_LENGTH);
      expect(email).toMatch(/^pqa-99999999999-[a-z]+-[a-z0-9]+@example\.com$/);
    }
  });
});
